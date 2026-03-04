import { NextResponse } from "next/server";
import { apiSuccess, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { getPlatformConfig } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const [dealer, config] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        hotDealCredits: true,
        futureAdCredits: true,
        totalListings: true,
      },
    }),
    getPlatformConfig(),
  ]);

  const totalListings = dealer?.totalListings ?? 0;
  const milestone = config.hotDealMilestone;
  const progressToNextMilestone = milestone - (totalListings % milestone);

  return apiSuccess({
    stats: {
      hotDealCredits: dealer?.hotDealCredits ?? 0,
      futureAdCredits: dealer?.futureAdCredits ?? 0,
      totalListings,
      hotDealMilestone: milestone,
      progressToNextMilestone,
    },
  });
});
