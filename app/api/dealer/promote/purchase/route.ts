import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { dealerPackagePurchaseSchema } from "@/lib/validators";

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const parsed = dealerPackagePurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const promotionPackage = await prisma.promotionPackage.findFirst({
    where: { id: parsed.data.packageId, isActive: true },
    select: { type: true, credits: true },
  });

  if (!promotionPackage) {
    return apiError("Package not found", 404);
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data:
      promotionPackage.type === "HOT_DEAL"
        ? { hotDealCredits: { increment: promotionPackage.credits } }
        : { futureAdCredits: { increment: promotionPackage.credits } },
  });

  return apiSuccess({});
});
