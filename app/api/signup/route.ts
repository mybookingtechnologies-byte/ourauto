import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { createSessionToken, getSessionCookieHeader } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";
import { logActivity } from "@/lib/activityLog";
import { verifyCsrf } from "@/lib/csrf";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    if (await isRateLimited(request, "auth-signup", 5, 60_000)) {
      return fail("Too many requests. Try again in a minute.", 429);
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const parsed = signupSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail("Invalid signup payload", 400);
    }

    const { name, dealerName, email, phone, password, referralCode } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return fail("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name,
        dealerName,
        email,
        phone,
        password: hashedPassword,
        referralCode: referralCode || null,
      },
      select: {
        id: true,
        email: true,
        dealerName: true,
        sessionVersion: true,
      },
    });

    await logActivity(createdUser.id, "SIGNUP", {
      email: createdUser.email,
    });

    const sessionToken = createSessionToken(createdUser.id, createdUser.sessionVersion);
    const response = ok({
      message: "Signup successful",
      user: {
        id: createdUser.id,
        email: createdUser.email,
        dealerName: createdUser.dealerName,
      },
    }, 201);
    response.headers.append("Set-Cookie", getSessionCookieHeader(sessionToken));
    return response;

  } catch (error) {
    logError("signup_error", error);
    return fail("Signup failed", 500);
  }
}
