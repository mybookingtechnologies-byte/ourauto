import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { adminCarActionSchema } from "@/lib/validators";

export const GET = withApiHandler(async (_request: NextRequest): Promise<NextResponse> => {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const cars = await prisma.car.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dealer: { select: { dealerName: true, businessName: true } },
    },
    take: 100,
  });

  return apiSuccess({ cars });
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
  const parsed = adminCarActionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  if (parsed.data.action === "DELETE") {
    await prisma.car.delete({ where: { id: parsed.data.carId } });
    await writeAuditLog({
      actorUserId: admin.userId,
      action: "ADMIN_DELETE_CAR",
      targetType: "Car",
      targetId: parsed.data.carId,
    });
  }
  if (parsed.data.action === "FEATURE") {
    await prisma.car.update({ where: { id: parsed.data.carId }, data: { isFeatured: true } });
    await writeAuditLog({
      actorUserId: admin.userId,
      action: "ADMIN_FEATURE_CAR",
      targetType: "Car",
      targetId: parsed.data.carId,
    });
  }

  return apiSuccess({});
});
