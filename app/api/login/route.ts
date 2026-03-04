import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { createSessionToken, getSessionCookieHeader } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";
import { logActivity } from "@/lib/activityLog";
import { verifyCsrf } from "@/lib/csrf";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    if (await isRateLimited(request, "auth-login", 5, 60_000)) {
      return fail("Too many requests. Try again in a minute.", 429);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail("Invalid login payload", 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return fail("Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return fail("Invalid credentials", 401);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        sessionVersion: {
          increment: 1,
        },
        loginCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        email: true,
        dealerName: true,
        sessionVersion: true,
      },
    });

    await logActivity(updatedUser.id, "LOGIN", {
      email: updatedUser.email,
    });

    const sessionToken = createSessionToken(updatedUser.id, updatedUser.sessionVersion);
    const response = ok(
      {
        message: "Login successful",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          dealerName: updatedUser.dealerName,
        },
      },
      200
    );
    response.headers.append("Set-Cookie", getSessionCookieHeader(sessionToken));
    return response;
  } catch (error) {
    logError("login_error", error);
    return fail("Login failed", 500);
  }
}
