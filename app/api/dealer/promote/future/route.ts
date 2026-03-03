import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { dealerPromotionActivateSchema } from "@/lib/validators";

const FUTURE_AD_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

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
  const parsed = dealerPromotionActivateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const existing = await prisma.car.findUnique({
    where: {
      id: parsed.data.carId,
    },
    select: {
      id: true,
      dealerId: true,
      status: true,
      isActive: true,
    },
  });

  if (!existing) {
    return apiError("Car not found", 404);
  }

  if (existing.dealerId !== auth.userId) {
    return apiError("Forbidden", 403);
  }

  if (existing.status !== "ACTIVE" || !existing.isActive) {
    return apiError("Promotion available only for active cars", 400);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: auth.userId,
          futureAdCredits: { gt: 0 },
        },
        data: {
          futureAdCredits: { decrement: 1 },
        },
      });

      if (updated.count === 0) {
        throw new Error("NO_CREDITS");
      }

      const futureAdUntil = new Date(Date.now() + FUTURE_AD_DURATION_MS);

      await tx.car.update({
        where: { id: existing.id },
        data: {
          isFutureAd: true,
          futureAdUntil,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_CREDITS") {
      return apiError("No Future Ad credits available", 400);
    }
    throw error;
  }

  return apiSuccess({});
});
