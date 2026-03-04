import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyCsrf } from "@/lib/csrf";
import { sendPasswordResetEmail } from "@/lib/email";
import { logError } from "@/lib/observability";
import { getEnv } from "@/lib/env";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    if (await isRateLimited(request, "auth-forgot-password", 5, 60_000)) {
      return fail("Too many requests. Try again in a minute.", 429);
    }

    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const email = body.email?.trim().toLowerCase();
    if (!email || !emailPattern.test(email)) {
      return fail("Valid email is required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = hashToken(token);
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry,
        },
      });

      const appUrl = getEnv("NEXT_PUBLIC_APP_URL");
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(user.email, resetLink);
      } catch (error) {
        logError("forgot_password_resend_error", error);
        throw error;
      }
    }

    return ok({ message: "Reset link sent if account exists" }, 200);
  } catch (error) {
    logError("forgot_password_error", error);
    const message = error instanceof Error ? error.message : "Failed to process forgot password request";
    return fail(message, 500);
  }
}
