import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { adminSubscriptionCreateSchema, adminSubscriptionUpdateSchema } from "@/lib/validators";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess({ subscriptions });
});

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const body = await request.json();
  const parsed = adminSubscriptionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const created = await prisma.subscription.create({
    data: {
      userId: parsed.data.userId,
      planName: parsed.data.planName,
      amount: parsed.data.amount,
      startsAt: new Date(parsed.data.startsAt),
      expiresAt: new Date(parsed.data.expiresAt),
      isActive: true,
    },
  });

  return apiSuccess({ subscription: created });
});

export const PATCH = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const body = await request.json();
  const parsed = adminSubscriptionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  await prisma.subscription.update({
    where: { id: parsed.data.id },
    data: {
      planName: parsed.data.planName,
      amount: parsed.data.amount,
      isActive: parsed.data.isActive,
    },
  });

  return apiSuccess({});
});
