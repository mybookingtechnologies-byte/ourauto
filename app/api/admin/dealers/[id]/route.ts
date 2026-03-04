import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/apiAuth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { enqueueNotificationJob } from "@/lib/queue";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { adminDealerStatusSchema } from "@/lib/validators";

export const PATCH = withApiHandler(async (request: NextRequest, { params }: { params?: Record<string, string> } = {}): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  if (!params?.id) {
    return apiError("Missing dealer id", 400);
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
  const parsed = adminDealerStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const dealer = await prisma.user.findFirst({
    where: { id: params.id, role: "DEALER" },
    select: { id: true },
  });

  if (!dealer) {
    return apiError("Dealer not found", 404);
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  await writeAuditLog({
    actorUserId: admin.userId,
    action: parsed.data.status === "APPROVED" ? "ADMIN_APPROVE_DEALER" : "ADMIN_REJECT_DEALER",
    targetType: "User",
    targetId: params.id,
    metadata: { status: parsed.data.status },
  });

  const message =
    parsed.data.status === "APPROVED"
      ? "Your dealer profile is approved. You can now access all dealer features."
      : "Your dealer profile was rejected. Please contact support for review.";

  void enqueueNotificationJob(params.id, "Dealer Status Update", message, {
    status: parsed.data.status,
    updatedBy: admin.userId,
  });

  logger.info("Admin updated dealer status", {
    adminUserId: admin.userId,
    dealerId: params.id,
    status: parsed.data.status,
  });

  return apiSuccess({});
});
