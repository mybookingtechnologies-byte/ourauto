import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup data" }, { status: 400 });
  }

  const exists = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.email }, { mobile: parsed.data.mobile }],
    },
  });

  if (exists) {
    return NextResponse.json({ error: "Email or mobile already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      dealerName: parsed.data.dealerName,
      businessName: parsed.data.businessName,
      email: parsed.data.email,
      mobile: parsed.data.mobile,
      passwordHash,
      role: "DEALER",
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true });
}
