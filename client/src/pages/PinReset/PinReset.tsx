import { useState } from "react";

import ForgotPin from "../ForgotPin/ForgotPin";
import VerifyOtp from "../VerifyOtp/VerifyOtp";
import ChangePin from "../ChangePin/ChangePin";

type PinResetStep =
  | "forgot"
  | "verify"
  | "change";

type PinResetProps = {
  onComplete: () => void;
  onBackToLogin: () => void;
};

function PinReset({
  onComplete,
  onBackToLogin,
}: PinResetProps) {
  const [step, setStep] =
    useState<PinResetStep>(
      "forgot",
    );

  const [email, setEmail] =
    useState("");

  const [otpId, setOtpId] =
    useState("");

  function handleOtpRequested(
    requestedEmail: string,
  ) {
    setEmail(requestedEmail);
    setStep("verify");
  }

  function handleVerified(
    verifiedOtpId: string,
  ) {
    setOtpId(verifiedOtpId);
    setStep("change");
  }

  function handleResetComplete() {
    setEmail("");
    setOtpId("");
    setStep("forgot");

    onComplete();
  }

  if (step === "forgot") {
    return (
      <ForgotPin
        onBack={onBackToLogin}
        onOtpRequested={
          handleOtpRequested
        }
      />
    );
  }

  if (step === "verify") {
    return (
      <VerifyOtp
        email={email}
        onVerified={handleVerified}
        onBack={() =>
          setStep("forgot")
        }
      />
    );
  }

  return (
    <ChangePin
      otpId={otpId}
      onComplete={
        handleResetComplete
      }
    />
  );
}

export default PinReset;