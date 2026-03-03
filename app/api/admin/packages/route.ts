import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { adminPackageCreateSchema, adminPackageUpdateSchema } from "@/lib/validators";

export const GET = withApiHandler(async (_request: NextRequest): Promise<NextResponse> => {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const packages = await prisma.promotionPackage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiSuccess({ packages });
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
  const parsed = adminPackageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const promotionPackage = await prisma.promotionPackage.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      credits: parsed.data.credits,
      price: parsed.data.price,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return apiSuccess({ package: promotionPackage });
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
  const parsed = adminPackageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  await prisma.promotionPackage.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      credits: parsed.data.credits,
      price: parsed.data.price,
      isActive: parsed.data.isActive,
    },
  });

  return apiSuccess({});
});
