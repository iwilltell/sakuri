import "dotenv/config";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma.js";

const SESSION_DAYS = 365;

// --------------------------------------------------
// PIN validation
// --------------------------------------------------

export function isValidPin(
  pin: unknown,
): pin is string {
  return (
    typeof pin === "string" &&
    /^\d{4}$/.test(pin)
  );
}

// --------------------------------------------------
// Session helpers
// --------------------------------------------------

function createSessionToken(): string {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function hashSessionToken(
  token: string,
): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function getSessionExpiry(): Date {
  const expiry = new Date();

  expiry.setDate(
    expiry.getDate() +
      SESSION_DAYS,
  );

  return expiry;
}

// --------------------------------------------------
// Setup status
// --------------------------------------------------

export async function getSetupStatus() {
  const accountCount =
    await prisma.account.count();

  const profileCount =
    await prisma.profile.count();

  return {
    accountCount,
    profileCount,

    remainingAccounts:
      Math.max(
        0,
        2 - accountCount,
      ),

    setupComplete:
      accountCount === 2,
  };
}

// --------------------------------------------------
// FIRST-TIME ACCOUNT CREATION
//
// Creates authentication credentials only.
// Profile is created separately.
// --------------------------------------------------

export async function createFirstAccount(
  input: {
    email: string;
    pin: string;
  },
) {
  const email =
    input.email
      .trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      "Email is required.",
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    throw new Error(
      "Enter a valid email address.",
    );
  }

  if (
    !isValidPin(input.pin)
  ) {
    throw new Error(
      "PIN must contain exactly 4 digits.",
    );
  }

  const accountCount =
    await prisma.account.count();

  if (accountCount >= 2) {
    throw new Error(
      "Sakuri already has two accounts.",
    );
  }

  const existing =
    await prisma.account.findUnique(
      {
        where: {
          email,
        },
      },
    );

  if (existing) {
    throw new Error(
      "An account with that email already exists.",
    );
  }

  const pinHash =
    await bcrypt.hash(
      input.pin,
      12,
    );

  const account =
    await prisma.account.create(
      {
        data: {
          email,
          pinHash,
        },

        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    );

  // Automatically log the new account in.
  const token =
    createSessionToken();

  const tokenHash =
    hashSessionToken(token);

  await prisma.session.create(
    {
      data: {
        accountId:
          account.id,

        tokenHash,

        expiresAt:
          getSessionExpiry(),
      },
    },
  );

  return {
    token,
    account,
  };
}

// --------------------------------------------------
// NORMAL LOGIN
// --------------------------------------------------

export async function loginWithPin(
  accountId: string,
  pin: string,
) {
  if (!isValidPin(pin)) {
    throw new Error(
      "PIN must contain exactly 4 digits.",
    );
  }

  const account =
    await prisma.account.findUnique(
      {
        where: {
          id: accountId,
        },

        include: {
          profile: true,
        },
      },
    );

  if (!account) {
    throw new Error(
      "Invalid account or PIN.",
    );
  }

  const validPin =
    await bcrypt.compare(
      pin,
      account.pinHash,
    );

  if (!validPin) {
    throw new Error(
      "Invalid account or PIN.",
    );
  }

  const token =
    createSessionToken();

  const tokenHash =
    hashSessionToken(token);

  await prisma.session.create(
    {
      data: {
        accountId:
          account.id,

        tokenHash,

        expiresAt:
          getSessionExpiry(),
      },
    },
  );

  return {
    token,

    account: {
      id: account.id,
      email: account.email,
      profile:
        account.profile,
    },
  };
}

// --------------------------------------------------
// GET ACCOUNT FROM SESSION
// --------------------------------------------------

export async function getAccountFromSession(
  token: string,
) {
  const tokenHash =
    hashSessionToken(token);

  const session =
    await prisma.session.findUnique(
      {
        where: {
          tokenHash,
        },

        include: {
          account: {
            include: {
              profile: true,
            },
          },
        },
      },
    );

  if (!session) {
    return null;
  }

  // Session expired
  if (
    session.expiresAt <=
    new Date()
  ) {
    await prisma.session.delete(
      {
        where: {
          id: session.id,
        },
      },
    );

    return null;
  }

  // Keep active users logged in.
  // The expiry is extended whenever
  // the session is successfully used.
  await prisma.session.update(
    {
      where: {
        id: session.id,
      },

      data: {
        expiresAt:
          getSessionExpiry(),
      },
    },
  );

  return {
    sessionId:
      session.id,

    account: {
      id: session.account.id,
      email:
        session.account.email,
      profile:
        session.account.profile,
    },
  };
}

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

export async function logoutSession(
  token: string,
) {
  const tokenHash =
    hashSessionToken(token);

  await prisma.session.deleteMany(
    {
      where: {
        tokenHash,
      },
    },
  );
}