import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma.js";
import { sendPinResetOtp } from "./email.service.js";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp(): string {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

async function hashOtp(
  otp: string,
): Promise<string> {
  return bcrypt.hash(otp, 10);
}

// --------------------------------------------------
// REQUEST PIN RESET
// --------------------------------------------------

export async function requestPinReset(
  email: string,
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email is required.",
    );
  }

  const account =
    await prisma.account.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  /*
   * Don't reveal whether an email exists.
   * The route can always return the same
   * successful response.
   */
  if (!account) {
    return;
  }

  await prisma.otp.deleteMany({
    where: {
      accountId: account.id,
      purpose: "CHANGE_PIN",
      verifiedAt: null,
    },
  });

  const otp = generateOtp();
  const codeHash = await hashOtp(otp);

  const expiresAt = new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES *
        60 *
        1000,
  );

  await prisma.otp.create({
    data: {
      accountId: account.id,
      codeHash,
      purpose: "CHANGE_PIN",
      expiresAt,
    },
  });

  await sendPinResetOtp(
    normalizedEmail,
    otp,
  );
}

// --------------------------------------------------
// REQUEST CHANGE-PIN OTP
// --------------------------------------------------

export async function requestChangePinOtp(
  email: string,
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email is required.",
    );
  }

  const account =
    await prisma.account.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (!account) {
    throw new Error(
      "Authenticated account could not be found.",
    );
  }

  await prisma.otp.deleteMany({
    where: {
      accountId: account.id,
      purpose: "CHANGE_PIN",
      verifiedAt: null,
    },
  });

  const otp = generateOtp();
  const codeHash = await hashOtp(otp);

  const expiresAt = new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES *
        60 *
        1000,
  );

  await prisma.otp.create({
    data: {
      accountId: account.id,
      codeHash,
      purpose: "CHANGE_PIN",
      expiresAt,
    },
  });

  await sendPinResetOtp(
    normalizedEmail,
    otp,
  );
}

// --------------------------------------------------
// VERIFY OTP
// --------------------------------------------------

export async function verifyPinResetOtp(
  email: string,
  otpCode: string,
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!/^\d{6}$/.test(otpCode)) {
    throw new Error(
      "OTP must contain exactly 6 digits.",
    );
  }

  const account =
    await prisma.account.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (!account) {
    throw new Error(
      "Invalid or expired OTP.",
    );
  }

  const otp =
    await prisma.otp.findFirst({
      where: {
        accountId: account.id,
        purpose: "CHANGE_PIN",
        verifiedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (!otp) {
    throw new Error(
      "Invalid or expired OTP.",
    );
  }

  if (
    otp.expiresAt <= new Date()
  ) {
    await prisma.otp.delete({
      where: {
        id: otp.id,
      },
    });

    throw new Error(
      "This OTP has expired.",
    );
  }

  if (
    otp.attempts >=
    MAX_OTP_ATTEMPTS
  ) {
    throw new Error(
      "Too many OTP attempts. Please request a new code.",
    );
  }

  const valid =
    await bcrypt.compare(
      otpCode,
      otp.codeHash,
    );

  if (!valid) {
    await prisma.otp.update({
      where: {
        id: otp.id,
      },

      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    throw new Error(
      "Invalid or expired OTP.",
    );
  }

  const verifiedOtp =
    await prisma.otp.update({
      where: {
        id: otp.id,
      },

      data: {
        verifiedAt: new Date(),
      },
    });

  return {
    otpId: verifiedOtp.id,
  };
}

// --------------------------------------------------
// VERIFY CHANGE-PIN OTP
// --------------------------------------------------

export async function verifyChangePinOtp(
  email: string,
  otpCode: string,
) {
  return verifyPinResetOtp(
    email,
    otpCode,
  );
}

// --------------------------------------------------
// RESET PIN
// --------------------------------------------------

export async function resetPin(
  otpId: string,
  newPin: string,
) {
  if (!/^\d{4}$/.test(newPin)) {
    throw new Error(
      "PIN must contain exactly 4 digits.",
    );
  }

  const otp =
    await prisma.otp.findUnique({
      where: {
        id: otpId,
      },
      include: {
        account: true,
      },
    });

  if (!otp) {
    throw new Error(
      "PIN reset request is invalid.",
    );
  }

  if (
    otp.purpose !== "CHANGE_PIN"
  ) {
    throw new Error(
      "PIN reset request is invalid.",
    );
  }

  if (!otp.verifiedAt) {
    throw new Error(
      "OTP verification is required.",
    );
  }

  if (
    otp.expiresAt <= new Date()
  ) {
    await prisma.otp.delete({
      where: {
        id: otp.id,
      },
    });

    throw new Error(
      "PIN reset request has expired.",
    );
  }

  const pinHash =
    await bcrypt.hash(
      newPin,
      12,
    );

  /*
   * Change the PIN and invalidate
   * every existing session.
   */
  await prisma.$transaction([
    prisma.account.update({
      where: {
        id: otp.accountId,
      },

      data: {
        pinHash,
      },
    }),

    prisma.session.deleteMany({
      where: {
        accountId: otp.accountId,
      },
    }),

    prisma.otp.delete({
      where: {
        id: otp.id,
      },
    }),
  ]);
}

// --------------------------------------------------
// CHANGE PIN
// --------------------------------------------------

export async function changePin(
  otpId: string,
  newPin: string,
) {
  return resetPin(
    otpId,
    newPin,
  );
}