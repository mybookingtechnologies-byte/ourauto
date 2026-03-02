import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const allowed = checkRateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login data" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.identifier.toLowerCase() }, { mobile: parsed.data.identifier }],
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.status !== "APPROVED") {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const token = await generateToken({ userId: user.id, role: user.role });

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set("ourauto_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
