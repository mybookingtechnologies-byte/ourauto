import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { dealerPasswordUpdateSchema, dealerProfileUpdateSchema } from "@/lib/validators";

export async function GET(): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      dealerName: true,
      businessName: true,
      city: true,
      email: true,
      mobile: true,
      profileImage: true,
      coverImage: true,
      bio: true,
    },
  });
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const passwordParsed = dealerPasswordUpdateSchema.safeParse(body);

  if (passwordParsed.success) {
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: "Invalid password request" }, { status: 400 });
    }
    const valid = await bcrypt.compare(passwordParsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(passwordParsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: auth.userId }, data: { passwordHash } });
    return NextResponse.json({ ok: true });
  }

  const profileParsed = dealerProfileUpdateSchema.safeParse(body);
  if (!profileParsed.success) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      dealerName: profileParsed.data.dealerName,
      businessName: profileParsed.data.businessName,
      city: profileParsed.data.city,
      profileImage: profileParsed.data.profileImage,
      coverImage: profileParsed.data.coverImage,
      bio: profileParsed.data.bio,
    },
  });

  return NextResponse.json({ ok: true });
}
