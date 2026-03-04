import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/adminAuth";
import { isRateLimited } from "@/lib/rateLimit";
import { getOrSetCache } from "@/lib/cache";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined;

  try {
    if (await isRateLimited(request, "admin-stats", 10, 60_000)) {
      return fail("Too many admin requests", 429);
    }

    const admin = await requireAdminApi(request);
    if (admin.response) {
      return admin.response;
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const metrics = await getOrSetCache("admin-stats", 45_000, async () => {
      const [
        totalDealers,
        totalListings,
        liveListings,
        deletedListings,
        todaysListings,
        todaysSignups,
        todaysLogins,
        hotDealsUsed,
        futureAdsUsed,
        suspiciousDealers,
      ] = await Promise.all([
        prisma.user.count({ where: { role: "DEALER" } }),
        prisma.listing.count(),
        prisma.listing.count({ where: { isLive: true } }),
        prisma.listing.count({ where: { deletedByAdmin: true } }),
        prisma.listing.count({ where: { createdAt: { gte: dayStart } } }),
        prisma.user.count({ where: { role: "DEALER", createdAt: { gte: dayStart } } }),
        prisma.activityLog.count({ where: { action: "LOGIN", createdAt: { gte: dayStart } } }),
        prisma.listing.count({ where: { boostType: "HOT_DEAL" } }),
        prisma.listing.count({ where: { boostType: "FUTURE_AD" } }),
        prisma.user.count({ where: { role: "DEALER", reputationScore: { lt: 40 } } }),
      ]);

      return {
        totalDealers,
        totalListings,
        liveListings,
        deletedListings,
        todaysListings,
        todaysSignups,
        todaysLogins,
        hotDealsUsed,
        futureAdsUsed,
        suspiciousDealers,
      };
    });

    return ok({
      metrics,
    });
  } catch (error) {
    logError("admin_stats_error", error, { requestId });
    return fail("Unable to load admin stats", 500);
  }
}
