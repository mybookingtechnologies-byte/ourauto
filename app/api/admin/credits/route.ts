import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { verifyCsrf } from "@/lib/csrf";
import { logActivity } from "@/lib/activityLog";
import { adminCreditsSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";

export async function PATCH(request: Request) {
  try {
    if (await isRateLimited(request, "admin-credits", 3, 60_000)) {
      return fail("Too many admin credit actions. Try again shortly.", 429);
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
    const parsed = adminCreditsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail("Invalid credit payload", 400);
    }

    const dealerId = parsed.data.dealerId;
    const hotDealCredits = Number(parsed.data.hotDealCredits || 0);
    const futureAdCredits = Number(parsed.data.futureAdCredits || 0);

    const updatedDealer = await prisma.user.update({
      where: { id: dealerId },
      data: {
        hotDealCredits: {
          increment: hotDealCredits > 0 ? hotDealCredits : 0,
        },
        futureAdCredits: {
          increment: futureAdCredits > 0 ? futureAdCredits : 0,
        },
      },
      select: {
        id: true,
        dealerName: true,
        hotDealCredits: true,
        futureAdCredits: true,
      },
    });

    if (hotDealCredits > 0) {
      await logActivity(admin.user.id, "ADD_HOT_DEAL_CREDIT", {
        dealerId,
        amount: hotDealCredits,
      });
    }

    if (futureAdCredits > 0) {
      await logActivity(admin.user.id, "ADD_FUTURE_AD_CREDIT", {
        dealerId,
        amount: futureAdCredits,
      });
    }

    return ok({ dealer: updatedDealer, message: "Credits updated" });
  } catch {
    return fail("Unable to update credits", 500);
  }
}
