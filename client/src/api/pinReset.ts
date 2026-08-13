const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000"
type ApiError = {
  message?: string;
};

type VerifyOtpResponse = {
  message: string;
  otpId: string;
};

async function request<T extends object>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers ?? {}),
        },
      },
    );

  const data =
    (await response.json()) as
      | T
      | ApiError;

  if (!response.ok) {
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message ===
        "string"
    ) {
      throw new Error(
        data.message,
      );
    }

    throw new Error(
      "Something went wrong.",
    );
  }

  return data as T;
}

// --------------------------------------------------
// FORGOT PIN
// --------------------------------------------------

export async function requestPinReset(
  email: string,
): Promise<void> {
  await request<{
    message: string;
  }>(
    "/api/auth/forgot-pin",
    {
      method: "POST",

      body: JSON.stringify({
        email,
      }),
    },
  );
}

// --------------------------------------------------
// FORGOT PIN - VERIFY OTP
// --------------------------------------------------

export async function verifyPinResetOtp(
  email: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  return request<VerifyOtpResponse>(
    "/api/auth/verify-otp",
    {
      method: "POST",

      body: JSON.stringify({
        email,
        otp,
      }),
    },
  );
}

// --------------------------------------------------
// FORGOT PIN - RESET
// --------------------------------------------------

export async function resetPin(
  otpId: string,
  newPin: string,
): Promise<void> {
  await request<{
    message: string;
  }>(
    "/api/auth/reset-pin",
    {
      method: "POST",

      body: JSON.stringify({
        otpId,
        newPin,
      }),
    },
  );
}

// ==================================================
// AUTHENTICATED CHANGE PIN
// ==================================================

// --------------------------------------------------
// SEND CHANGE PIN OTP
// --------------------------------------------------

export async function requestChangePinOtp(): Promise<void> {
  await request<{
    message: string;
  }>(
    "/api/auth/change-pin/send-otp",
    {
      method: "POST",
    },
  );
}

// --------------------------------------------------
// VERIFY CHANGE PIN OTP
// --------------------------------------------------

export async function verifyChangePinOtp(
  otp: string,
): Promise<VerifyOtpResponse> {
  return request<VerifyOtpResponse>(
    "/api/auth/change-pin/verify-otp",
    {
      method: "POST",

      body: JSON.stringify({
        otp,
      }),
    },
  );
}

// --------------------------------------------------
// CHANGE PIN
// --------------------------------------------------

export async function changePin(
  otpId: string,
  newPin: string,
): Promise<void> {
  await request<{
    message: string;
  }>(
    "/api/auth/change-pin",
    {
      method: "POST",

      body: JSON.stringify({
        otpId,
        newPin,
      }),
    },
  );
}