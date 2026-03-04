import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";

export const GET = withApiHandler(async (_request: NextRequest): Promise<NextResponse> => {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const allowed = await checkRateLimit(`notif:${auth.userId}`, 120, 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess({ notifications });
});

export const PATCH = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as { id?: string; markAll?: boolean };
  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { userId: auth.userId, isRead: false },
      data: { isRead: true },
    });
    return apiSuccess({});
  }

  if (!body.id) {
    return apiError("Notification id required", 400);
  }

  await prisma.notification.updateMany({
    where: { id: body.id, userId: auth.userId },
    data: { isRead: true },
  });

  return apiSuccess({});
});
