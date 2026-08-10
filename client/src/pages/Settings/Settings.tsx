import {
  useState,
} from "react";

import {
  requestChangePinOtp,
  verifyChangePinOtp,
} from "../../api/pinReset";

import ChangePin from "../ChangePin/ChangePin";

import "./Settings.css";

type SettingsProps = {
  email: string;
  onLogout: () => void;
};

type SettingsStep =
  | "idle"
  | "otp"
  | "change-pin";

function Settings({
  email,
  onLogout,
}: SettingsProps) {
  const [step, setStep] =
    useState<SettingsStep>(
      "idle",
    );

  const [otp, setOtp] =
    useState("");

  const [otpId, setOtpId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // --------------------------------------------------
  // SEND OTP
  // --------------------------------------------------

  async function sendOtp() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await requestChangePinOtp();

      setMessage(
        "A 6-digit verification code has been sent to your registered email.",
      );

      setStep("otp");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // VERIFY OTP
  // --------------------------------------------------

  async function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Enter the 6-digit OTP.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result =
        await verifyChangePinOtp(
          otp,
        );

      setOtpId(
        result.otpId,
      );

      setOtp("");

      setMessage(
        "Email verified. Choose your new PIN.",
      );

      setStep("change-pin");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to verify OTP.",
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // CANCEL
  // --------------------------------------------------

  function cancelPinChange() {
    setStep("idle");
    setOtp("");
    setOtpId("");
    setError("");
    setMessage("");
  }

  // --------------------------------------------------
  // PIN CHANGED
  // --------------------------------------------------

  function handlePinChanged() {
    /*
     * The backend invalidates all sessions
     * after changing the PIN.
     *
     * Reloading lets App.tsx run its
     * normal authentication check and
     * return the user to the login screen.
     */
    window.location.reload();
  }

  // --------------------------------------------------
  // CHANGE PIN SCREEN
  // --------------------------------------------------

  if (
    step === "change-pin" &&
    otpId
  ) {
    return (
      <section className="settings-page">
        <header className="settings-header">
          <div>
            <p className="settings-eyebrow">
              Sakuri security 🌸
            </p>

            <h1>
              Change PIN
            </h1>

            <p className="settings-subtitle">
              Your email has been
              verified.
            </p>
          </div>
        </header>

        {message && (
          <div className="settings-message">
            {message}
          </div>
        )}

        <ChangePin
          otpId={otpId}
          onComplete={
            handlePinChanged
          }
        />

        <button
          type="button"
          className="settings-secondary-button"
          onClick={
            cancelPinChange
          }
        >
          Cancel
        </button>
      </section>
    );
  }

  // --------------------------------------------------
  // SETTINGS PAGE
  // --------------------------------------------------

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <p className="settings-eyebrow">
            Sakuri preferences 🌸
          </p>

          <h1>
            Settings
          </h1>

          <p className="settings-subtitle">
            Keep your account safe and
            secure.
          </p>
        </div>
      </header>

      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      {message && (
        <div className="settings-message">
          {message}
        </div>
      )}

      <div className="settings-list">

        {/* SECURITY */}

        <div className="settings-card">
          <div className="settings-card-icon">
            🔐
          </div>

          <div className="settings-card-content">
            <h2>
              Security
            </h2>

            <p>
              Change your 4-digit PIN
              using email verification.
            </p>

            {step === "idle" && (
              <button
                type="button"
                className="settings-primary-button"
                onClick={() =>
                  void sendOtp()
                }
                disabled={loading}
              >
                {loading
                  ? "Sending..."
                  : "Change PIN"}
              </button>
            )}

            {step === "otp" && (
              <div className="pin-change-form">
                <p className="pin-step-text">
                  Enter the 6-digit code
                  sent to:
                </p>

                <div className="settings-email">
                  {email}
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
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
                  placeholder="000000"
                  autoFocus
                />

                <div className="settings-form-actions">
                  <button
                    type="button"
                    className="settings-primary-button"
                    onClick={() =>
                      void verifyOtp()
                    }
                    disabled={
                      loading ||
                      otp.length !== 6
                    }
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify OTP"}
                  </button>

                  <button
                    type="button"
                    className="settings-secondary-button"
                    onClick={
                      cancelPinChange
                    }
                    disabled={
                      loading
                    }
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACCOUNT */}

        <div className="settings-card">
          <div className="settings-card-icon">
            📧
          </div>

          <div className="settings-card-content">
            <h2>
              Account
            </h2>

            <p>
              Your registered email is
              used for account security
              and PIN recovery.
            </p>

            <div className="settings-email">
              {email}
            </div>
          </div>
        </div>

        {/* LOGOUT */}

        <div className="settings-card settings-logout-card">
          <div className="settings-card-icon">
            🚪
          </div>

          <div className="settings-card-content">
            <h2>
              Log out
            </h2>

            <p>
              End your current Sakuri
              session.
            </p>

            <button
              type="button"
              className="settings-logout-button"
              onClick={onLogout}
              disabled={loading}
            >
              Log out
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Settings;