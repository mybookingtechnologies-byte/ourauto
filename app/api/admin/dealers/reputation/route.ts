import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/adminAuth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    if (await isRateLimited(request, "admin-dealer-reputation", 20, 60_000)) {
      return fail("Too many admin requests", 429);
    }

    const admin = await requireAdminApi(request);
    if (admin.response) {
      return admin.response;
    }

    const dealers = await prisma.user.findMany({
      where: { role: "DEALER" },
      select: {
        id: true,
        dealerName: true,
        reputationScore: true,
        totalListings: true,
        duplicateListings: true,
        spamReports: true,
      },
      orderBy: [
        { reputationScore: "asc" },
        { createdAt: "desc" },
      ],
    });

    return ok({
      dealers: dealers.map((dealer) => ({
        dealerId: dealer.id,
        name: dealer.dealerName,
        reputationScore: dealer.reputationScore,
        totalListings: dealer.totalListings,
        duplicateListings: dealer.duplicateListings,
        spamReports: dealer.spamReports,
      })),
    });
  } catch (error) {
    logError("admin_dealer_reputation_error", error);
    return fail("Unable to load dealer reputation", 500);
  }
}
