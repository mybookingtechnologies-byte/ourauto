import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/adminAuth";
import { verifyCsrf } from "@/lib/csrf";
import { logActivity } from "@/lib/activityLog";
import { applyReputationChange } from "@/lib/reputation";
import { isRateLimited } from "@/lib/rateLimit";
import { z } from "zod";
import { logError } from "@/lib/observability";
import { invalidateCache } from "@/lib/cache";

const deleteListingSchema = z.object({
  listingId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined;

  try {
    if (await isRateLimited(request, "admin-listing-delete", 5, 60_000)) {
      return fail("Too many admin delete requests", 429);
    }

    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    const admin = await requireAdminApi(request);
    if (admin.response || !admin.user) {
      return admin.response || fail("Forbidden", 403);
    }

    const rawBody = await request.json();
    const parsed = deleteListingSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail("listingId is required", 400);
    }

    const listingId = parsed.data.listingId;

    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        deletedByAdmin: true,
        deletedAt: new Date(),
        isLive: false,
      },
      select: {
        id: true,
        dealerId: true,
        title: true,
        deletedByAdmin: true,
        deletedAt: true,
        isLive: true,
      },
    });

    await applyReputationChange(prisma, {
      dealerId: listing.dealerId,
      reason: "ADMIN_DELETE",
      scoreChange: -10,
      adminDeleteIncrement: 1,
    });

    await logActivity(admin.user.id, "ADMIN_DELETE_LISTING", {
      listingId: listing.id,
      title: listing.title,
    });

    invalidateCache("listings:");
    invalidateCache("public-stats");
    invalidateCache("admin-stats");

    return ok({ listing, message: "Listing deleted by admin" });
  } catch (error) {
    logError("admin_delete_listing_error", error, { requestId });
    return fail("Unable to delete listing", 500);
  }
}
