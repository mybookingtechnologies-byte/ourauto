import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/apiAuth";
import { getPlatformConfig } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { adminPlatformConfigSchema } from "@/lib/validators";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const config = await getPlatformConfig();
  return apiSuccess({ config });
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
  const parsed = adminPlatformConfigSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const current = await getPlatformConfig();
  const config = await prisma.platformConfig.upsert({
    where: { id: "main" },
    update: {
      hotDealMilestone: parsed.data.hotDealMilestone ?? current.hotDealMilestone,
      referralReward: parsed.data.referralReward ?? current.referralReward,
    },
    create: {
      id: "main",
      hotDealMilestone: parsed.data.hotDealMilestone ?? current.hotDealMilestone,
      referralReward: parsed.data.referralReward ?? current.referralReward,
    },
    select: {
      hotDealMilestone: true,
      referralReward: true,
    },
  });

  return apiSuccess({ config });
});
