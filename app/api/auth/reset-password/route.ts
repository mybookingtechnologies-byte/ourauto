import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyCsrf } from "@/lib/csrf";
import { logError } from "@/lib/observability";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    if (await isRateLimited(request, "auth-reset-password", 5, 60_000)) {
      return fail("Too many requests. Try again in a minute.", 429);
    }

    let body: { token?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const token = body.token?.trim();
    const password = body.password;

    if (!token || !password) {
      return fail("Token and password are required", 400);
    }

    if (password.length < 6) {
      return fail("Password must be at least 6 characters", 400);
    }

    const hashedToken = hashToken(token);
    const now = new Date();

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return fail("Invalid or expired reset token", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        sessionVersion: {
          increment: 1,
        },
      },
    });

    return ok({ message: "Password reset successful" }, 200);
  } catch (error) {
    logError("reset_password_error", error);
    return fail("Failed to reset password", 500);
  }
}
