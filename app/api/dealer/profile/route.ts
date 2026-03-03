import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { dealerPasswordUpdateSchema, dealerProfileUpdateSchema } from "@/lib/validators";

export const GET = withApiHandler(async (_request: NextRequest): Promise<NextResponse> => {
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
  return apiSuccess({ user });
});

export const PATCH = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const passwordParsed = dealerPasswordUpdateSchema.safeParse(body);

  if (passwordParsed.success) {
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return apiError("Invalid password request", 400);
    }
    const valid = await bcrypt.compare(passwordParsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return apiError("Invalid current password", 400);
    }
    const passwordHash = await bcrypt.hash(passwordParsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: auth.userId }, data: { passwordHash } });
    await writeAuditLog({
      actorUserId: auth.userId,
      action: "DEALER_CHANGE_PASSWORD",
      targetType: "User",
      targetId: auth.userId,
    });
    return apiSuccess({});
  }

  const profileParsed = dealerProfileUpdateSchema.safeParse(body);
  if (!profileParsed.success) {
    return apiError("Invalid profile payload", 400);
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

  await writeAuditLog({
    actorUserId: auth.userId,
    action: "DEALER_UPDATE_PROFILE",
    targetType: "User",
    targetId: auth.userId,
  });

  return apiSuccess({});
});
