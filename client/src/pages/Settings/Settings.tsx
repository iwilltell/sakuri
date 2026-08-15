import {
  useState,
} from "react";

import "./Settings.css";

import {
  isMusicEnabled,
  isTouchSoundEnabled,
  setMusicEnabled,
  setTouchSoundEnabled,
} from "../../audio/SakuriAudio";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

type SettingsProps = {
  email: string;
  onLogout: () => void;
};

type OtpStep =
  | "idle"
  | "otp"
  | "new-pin";

function Settings({
  email,
  onLogout,
}: SettingsProps) {
  const [step, setStep] =
    useState<OtpStep>("idle");

  const [otp, setOtp] =
    useState("");

  const [newPin, setNewPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [musicEnabled, setMusicEnabledState] =
    useState(isMusicEnabled());

  const [touchSoundsEnabled, setTouchSoundsEnabledState] =
    useState(isTouchSoundEnabled());

  // --------------------------------------------------
  // AUDIO SETTINGS
  // --------------------------------------------------

  function toggleMusic(): void {
    const next =
      !musicEnabled;

    setMusicEnabledState(next);
    setMusicEnabled(next);
  }

  function toggleTouchSounds(): void {
    const next =
      !touchSoundsEnabled;

    setTouchSoundsEnabledState(next);
    setTouchSoundEnabled(next);
  }

  // --------------------------------------------------
  // SEND OTP
  // --------------------------------------------------

  async function sendOtp() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          `${API_URL}/api/auth/change-pin/send-otp`,
          {
            method: "POST",
            credentials: "include",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to send OTP.",
        );
      }

      setMessage(
        "A verification code has been sent to your registered email.",
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

      const response =
        await fetch(
          `${API_URL}/api/auth/change-pin/verify-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              otp,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Invalid OTP.",
        );
      }

      setMessage(
        "Email verified. Choose your new PIN.",
      );

      setStep("new-pin");
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
  // CHANGE PIN
  // --------------------------------------------------

  async function changePin() {
    if (!/^\d{4}$/.test(newPin)) {
      setError(
        "Your new PIN must contain exactly 4 digits.",
      );

      return;
    }

    if (newPin !== confirmPin) {
      setError(
        "The PINs do not match.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          `${API_URL}/api/auth/change-pin`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              newPin,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to change PIN.",
        );
      }

      setOtp("");
      setNewPin("");
      setConfirmPin("");
      setStep("idle");

      setMessage(
        "Your PIN has been changed successfully. Please log in again.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to change PIN.",
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
    setNewPin("");
    setConfirmPin("");
    setError("");
    setMessage("");
  }

  // --------------------------------------------------
  // PAGE
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

            {/* OTP */}

            {step === "otp" && (
              <div className="pin-change-form">
                <p className="pin-step-text">
                  Enter the 6-digit code
                  sent to your registered
                  email.
                </p>

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
                      loading
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

            {/* NEW PIN */}

            {step === "new-pin" && (
              <div className="pin-change-form">
                <p className="pin-step-text">
                  Create your new
                  4-digit PIN.
                </p>

                <label>
                  New PIN

                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="new-password"
                    value={newPin}
                    onChange={(event) =>
                      setNewPin(
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    placeholder="••••"
                    autoFocus
                  />
                </label>

                <label>
                  Confirm PIN

                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="new-password"
                    value={
                      confirmPin
                    }
                    onChange={(event) =>
                      setConfirmPin(
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    placeholder="••••"
                  />
                </label>

                <div className="settings-form-actions">
                  <button
                    type="button"
                    className="settings-primary-button"
                    onClick={() =>
                      void changePin()
                    }
                    disabled={
                      loading
                    }
                  >
                    {loading
                      ? "Changing..."
                      : "Change PIN"}
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

        {/* AUDIO / EXPERIENCE */}

        <div className="settings-card">
          <div className="settings-card-icon">
            🎵
          </div>

          <div className="settings-card-content">
            <h2>
              Sakuri Sounds
            </h2>

            <p>
              Add a little music and
              gentle sounds while using
              Sakuri.
            </p>

            <div className="settings-audio-row">
              <div>
                <strong>
                  🎵 Background Music
                </strong>

                <span>
                  Soft music while using
                  Sakuri
                </span>
              </div>

              <button
                type="button"
                className={`settings-toggle ${
                  musicEnabled
                    ? "enabled"
                    : ""
                }`}
                aria-label={
                  musicEnabled
                    ? "Turn background music off"
                    : "Turn background music on"
                }
                aria-pressed={
                  musicEnabled
                }
                onClick={
                  toggleMusic
                }
              >
                <span />
              </button>
            </div>

            <div className="settings-audio-row">
              <div>
                <strong>
                  🔊 Touch Sounds
                </strong>

                <span>
                  Gentle sounds when
                  interacting
                </span>
              </div>

              <button
                type="button"
                className={`settings-toggle ${
                  touchSoundsEnabled
                    ? "enabled"
                    : ""
                }`}
                aria-label={
                  touchSoundsEnabled
                    ? "Turn touch sounds off"
                    : "Turn touch sounds on"
                }
                aria-pressed={
                  touchSoundsEnabled
                }
                onClick={
                  toggleTouchSounds
                }
              >
                <span />
              </button>
            </div>
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