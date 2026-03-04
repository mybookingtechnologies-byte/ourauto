import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    if (await isRateLimited(request, "dealer-leads", 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || 0), 0);
    const take = Math.min(Math.max(Number(searchParams.get("take") || 20), 1), 50);
    const skip = page * take;

    const leads = await prisma.referralActivity.findMany({
      where: { dealerId: user.id },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        referredUser: {
          select: {
            id: true,
            dealerName: true,
            phone: true,
          },
        },
      },
    });

    return ok({
      leads: leads.map((lead) => ({
        id: lead.id,
        buyerName: lead.referredUser.dealerName,
        phone: lead.referredUser.phone,
        car: "Referral Lead",
        message: "Joined using your referral",
        status: "New",
        date: lead.createdAt.toISOString(),
      })),
      page,
      take,
    });
  } catch (error) {
    logError("dealer_leads_error", error);
    return fail("Unable to load leads", 500);
  }
}
