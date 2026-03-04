import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/adminAuth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    if (await isRateLimited(request, "admin-listings", 20, 60_000)) {
      return fail("Too many admin requests", 429);
    }

    const admin = await requireAdminApi(request);
    if (admin.response) {
      return admin.response;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || 0), 0);
    const take = Math.min(Math.max(Number(searchParams.get("take") || 50), 1), 100);
    const skip = page * take;

    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        createdAt: true,
        isLive: true,
        deletedByAdmin: true,
        dealer: {
          select: {
            dealerName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
      skip,
    });

    return ok({ listings, page, take });
  } catch (error) {
    logError("admin_listings_error", error);
    return fail("Unable to load listings", 500);
  }
}
