import {
  useState,
} from "react";

import {
  changePin,
} from "../../api/pinReset";

type ChangePinProps = {
  otpId: string;
  onComplete: () => void;
};

function ChangePin({
  otpId,
  onComplete,
}: ChangePinProps) {
  const [newPin, setNewPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
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

    if (!/^\d{4}$/.test(newPin)) {
      setError(
        "Your new PIN must contain exactly 4 digits.",
      );

      return;
    }

    if (
      newPin !== confirmPin
    ) {
      setError(
        "The PINs do not match.",
      );

      return;
    }

    try {
      setLoading(true);

      await changePin(
        otpId,
        newPin,
      );

      onComplete();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to change your PIN.",
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
          One last step 🌸
        </p>

        <h1>
          Create a new PIN
        </h1>

        <p className="setup-text">
          Choose a new 4-digit PIN
          for your Sakuri account.
        </p>

        <form
          onSubmit={handleSubmit}
        >
          <label>
            New PIN

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
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
              autoComplete="new-password"
              autoFocus
              disabled={loading}
            />
          </label>

          <label>
            Confirm new PIN

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(event) =>
                setConfirmPin(
                  event.target.value.replace(
                    /\D/g,
                    "",
                  ),
                )
              }
              placeholder="••••"
              autoComplete="new-password"
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
              newPin.length !== 4 ||
              confirmPin.length !== 4
            }
          >
            {loading
              ? "Changing PIN..."
              : "Change PIN 🌸"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ChangePin;