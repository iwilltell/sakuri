import { useState } from "react";

import { requestPinReset } from "../../api/pinReset";

type ForgotPinProps = {
  onBack: () => void;
  onOtpRequested: (email: string) => void;
};

function ForgotPin({
  onBack,
  onOtpRequested,
}: ForgotPinProps) {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Enter your email address.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail,
      )
    ) {
      setError(
        "Enter a valid email address.",
      );
      return;
    }

    try {
      setLoading(true);

      await requestPinReset(
        cleanEmail,
      );

      /*
       * The backend intentionally returns
       * the same response whether or not
       * the email exists.
       */
      setMessage(
        "If an account exists for this email, a verification code has been sent.",
      );

      onOtpRequested(
        cleanEmail,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to request a PIN reset.",
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
          Forgot your PIN? 🌸
        </p>

        <h1>
          Reset your PIN
        </h1>

        <p className="setup-text">
          Enter the email connected to
          your Sakuri account and we'll
          send you a verification code.
        </p>

        <form
          onSubmit={handleSubmit}
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="Your email"
              autoComplete="email"
              disabled={loading}
            />
          </label>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {message && (
            <p className="success-message">
              {message}
            </p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send verification code"}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to login
        </button>
      </div>
    </section>
  );
}

export default ForgotPin;