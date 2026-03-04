import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    if (await isRateLimited(request, "dealer-analytics", 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalListings, liveListings, monthlyListings, topListing] = await Promise.all([
      prisma.listing.count({ where: { dealerId: user.id } }),
      prisma.listing.count({ where: { dealerId: user.id, isLive: true } }),
      prisma.listing.count({ where: { dealerId: user.id, createdAt: { gte: monthStart } } }),
      prisma.listing.findFirst({
        where: { dealerId: user.id },
        orderBy: { price: "desc" },
        select: { title: true },
      }),
    ]);

    const leadConversion = totalListings > 0 ? Math.round((liveListings / totalListings) * 1000) / 10 : 0;

    return ok({
      totalListings,
      liveListings,
      leadConversion,
      topListing: topListing?.title || "-",
      monthlyActivity: monthlyListings,
    });
  } catch (error) {
    logError("dealer_analytics_error", error);
    return fail("Unable to load analytics", 500);
  }
}
