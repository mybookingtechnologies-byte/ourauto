import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, getClientIp, withApiHandler } from "@/lib/api";
import { generateToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { loginSchema } from "@/lib/validators";

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`login:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid login data", 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.identifier.toLowerCase() }, { mobile: parsed.data.identifier }],
    },
    select: {
      id: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return apiError("Invalid credentials", 401);
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return apiError("Invalid credentials", 401);
  }

  if (user.role === "DEALER" && user.status !== "APPROVED") {
    return apiError("Dealer account is pending approval", 403);
  }

  const token = await generateToken({ userId: user.id, role: user.role });

  const response = apiSuccess({ role: user.role });
  response.cookies.set("ourauto_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
});
