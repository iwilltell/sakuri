import { useState } from "react";

import { verifyPinResetOtp } from "../../api/pinReset";

type VerifyOtpProps = {
  email: string;
  onVerified: (otpId: string) => void;
  onBack: () => void;
};

function VerifyOtp({
  email,
  onVerified,
  onBack,
}: VerifyOtpProps) {
  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Enter the 6-digit verification code.",
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await verifyPinResetOtp(
          email,
          otp,
        );

      onVerified(result.otpId);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to verify the code.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="center-screen">
      <div className="glass setup-card">
        <img
          src="/logo.png"
          alt="Sakuri"
          className="setup-logo"
        />

        <p className="eyebrow">
          Almost there 🌸
        </p>

        <h1>
          Verify your email
        </h1>

        <p className="setup-text">
          Enter the 6-digit code we
          sent to:
        </p>

        <p
          style={{
            marginTop: "-16px",
            marginBottom: "24px",
            fontWeight: 700,
            color: "#67152f",
            wordBreak: "break-word",
          }}
        >
          {email}
        </p>

        <form
          onSubmit={handleSubmit}
        >
          <label>
            Verification code

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value.replace(
                    /\D/g,
                    "",
                  ),
                )
              }
              placeholder="••••••"
              autoComplete="one-time-code"
              autoFocus
              disabled={loading}
            />
          </label>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={
              loading ||
              otp.length !== 6
            }
          >
            {loading
              ? "Verifying..."
              : "Verify code 🌸"}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button"
          onClick={onBack}
          disabled={loading}
        >
          ← Change email
        </button>
      </div>
    </section>
  );
}

export default VerifyOtp;