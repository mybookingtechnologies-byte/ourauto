import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { logError } from "@/lib/observability";
import { isRateLimited } from "@/lib/rateLimit";

type ReferralBody = {
  dealerId?: string;
  referredUserId?: string;
};

const DAILY_REFERRAL_LIMIT = 10;

export async function POST(request: Request) {
  try {
    if (await isRateLimited(request, "referrals", 10, 60_000)) {
      return fail("Too many referral requests", 429);
    }

    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    let body: ReferralBody;

    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const dealerId = body.dealerId?.trim() || user.id;
    const referredUserId = body.referredUserId?.trim();

    if (dealerId !== user.id) {
      return fail("Forbidden", 403);
    }

    if (!referredUserId) {
      return fail("referredUserId is required", 400);
    }

    if (referredUserId === dealerId) {
      return fail("Self-referral is not allowed", 400);
    }

    const dealer = await prisma.user.findUnique({
      where: { id: dealerId },
      select: { id: true },
    });

    if (!dealer) {
      return fail("Dealer not found", 404);
    }

    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId },
      select: { id: true },
    });

    if (!referredUser) {
      return fail("Referred user does not exist", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dailyCount = await tx.referralActivity.count({
        where: {
          dealerId,
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      if (dailyCount >= DAILY_REFERRAL_LIMIT) {
        throw new Error("DAILY_LIMIT_REACHED");
      }

      const alreadyCounted = await tx.referralActivity.findUnique({
        where: {
          dealerId_referredUserId: {
            dealerId,
            referredUserId,
          },
        },
        select: { id: true },
      });

      if (alreadyCounted) {
        throw new Error("REFERRAL_ALREADY_COUNTED");
      }

      await tx.referralActivity.create({
        data: {
          dealerId,
          referredUserId,
        },
      });

      const currentDealer = await tx.user.findUnique({
        where: { id: dealerId },
        select: {
          referralCounter: true,
        },
      });

      if (!currentDealer) {
        throw new Error("DEALER_NOT_FOUND");
      }

      const totalCounter = currentDealer.referralCounter + 1;
      const earnedCredits = Math.floor(totalCounter / 5);
      const remainingCounter = totalCounter % 5;

      const updatedDealer = await tx.user.update({
        where: { id: dealerId },
        data: {
          referralCounter: remainingCounter,
          futureAdCredits: {
            increment: earnedCredits,
          },
        },
        select: {
          id: true,
          futureAdCredits: true,
          referralCounter: true,
        },
      });

      return { earnedCredits, updatedDealer };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return ok(
      {
        earnedCredits: result.earnedCredits,
        wallet: result.updatedDealer,
      },
      200
    );
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_LIMIT_REACHED") {
      return fail("Daily referral limit reached", 429);
    }

    if (error instanceof Error && error.message === "REFERRAL_ALREADY_COUNTED") {
      return fail("Referral already counted for this user", 409);
    }

    if (error instanceof Error && error.message === "DEALER_NOT_FOUND") {
      return fail("Dealer not found", 404);
    }

    logError("referral_credit_error", error);
    return fail("Unable to process referrals", 500);
  }
}
