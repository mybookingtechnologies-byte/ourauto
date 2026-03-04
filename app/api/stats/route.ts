import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getOrSetCache } from "@/lib/cache";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined;

  try {
    const payload = await getOrSetCache("public-stats", 45_000, async () => {
      const dealers = await prisma.user.count();
      const listings = await prisma.listing.count({ where: { isLive: true } });
      const unreadMessages = 0;
      return { listings, dealers, unreadMessages };
    });

    return ok(payload, 200);
  } catch (error) {
    logError("public_stats_error", error, { requestId });
    return fail("Unable to load stats", 500);
  }
}
