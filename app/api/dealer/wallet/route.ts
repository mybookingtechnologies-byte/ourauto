import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId")?.trim();

    if (dealerId && dealerId !== user.id) {
      return fail("Forbidden", 403);
    }

    const dealer = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        dealerName: true,
        hotDealCredits: true,
        futureAdCredits: true,
        referralCounter: true,
      },
    });

    if (!dealer) {
      return fail("Dealer not found", 404);
    }

    return ok({ wallet: dealer }, 200);
  } catch (error) {
    logError("dealer_wallet_error", error);
    return fail("Unable to load wallet", 500);
  }
}
