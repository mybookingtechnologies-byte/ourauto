import { Resend } from "resend";
import { getEnv, hasEnv } from "@/lib/env";
import { logError, logInfo } from "@/lib/observability";

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  if (!hasEnv("RESEND_API_KEY")) {
    logInfo("password_reset_email_skipped", {
      email,
      reason: "RESEND_API_KEY_MISSING",
      resetLink,
    });
    return;
  }

  const resendApiKey = getEnv("RESEND_API_KEY");

  const resend = new Resend(resendApiKey);

  try {
    const response = await resend.emails.send({
      from: "OurAuto <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your Password",
      html: `       <h2>Password Reset</h2>       <p>Click the link below to reset your password.</p>       <a href="${resetLink}">Reset Password</a>       <p>This link will expire in 1 hour.</p>
    `,
    });

    logInfo("password_reset_email_sent", {
      email,
      providerMessageId: response?.data?.id || null,
    });
  } catch (error) {
    logError("password_reset_email_error", error, { email });
    throw error;
  }
}
