import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailUser || !emailPassword) {
  throw new Error(
    "EMAIL_USER and EMAIL_PASSWORD must be configured.",
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: emailUser,
    pass: emailPassword,
  },

  // Prevent production requests from hanging forever.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

export async function sendPinResetOtp(
  email: string,
  otp: string,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Sakuri" <${emailUser}>`,
      to: email,

      subject: "Your Sakuri PIN reset code",

      text: [
        "Your Sakuri PIN reset code is:",
        "",
        otp,
        "",
        "This code expires in 10 minutes.",
        "",
        "If you did not request a PIN reset, you can safely ignore this email.",
      ].join("\n"),

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 520px;
          margin: 0 auto;
          padding: 32px;
          color: #67152f;
        ">
          <h1 style="margin-bottom: 8px;">
            Reset your Sakuri PIN 🌸
          </h1>

          <p>
            Use the code below to continue resetting
            your Sakuri PIN.
          </p>

          <div style="
            margin: 28px 0;
            padding: 18px;
            text-align: center;
            border-radius: 14px;
            background: #fff0f5;
            font-size: 30px;
            font-weight: bold;
            letter-spacing: 8px;
          ">
            ${otp}
          </div>

          <p>
            This code expires in <strong>10 minutes</strong>.
          </p>

          <p style="color: #82485e;">
            If you didn't request this, you can safely
            ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Sakuri email delivery failed:", error);

    throw new Error(
      "Unable to send the verification email. Please try again in a moment.",
    );
  }
}