import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { chatRoomCreateSchema } from "@/lib/validators";

function normalizeDealerPair(first: string, second: string): [string, string] {
  return first < second ? [first, second] : [second, first];
}

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const allowed = await checkRateLimit(`chat:${auth.userId}`, 80, 60 * 1000);
  if (!allowed) {
    return apiError("Too many chat requests", 429);
  }

  const rooms = await prisma.chatRoom.findMany({
    where: {
      OR: [{ dealerOneId: auth.userId }, { dealerTwoId: auth.userId }],
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ rooms });
});

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const allowed = await checkRateLimit(`chat:${auth.userId}`, 80, 60 * 1000);
  if (!allowed) {
    return apiError("Too many chat requests", 429);
  }

  const body = await request.json();
  const parsed = chatRoomCreateSchema.safeParse(body);
  if (!parsed.success || parsed.data.targetDealerId === auth.userId) {
    return apiError("Invalid target dealer", 400);
  }

  const [dealerOneId, dealerTwoId] = normalizeDealerPair(auth.userId, parsed.data.targetDealerId);

  const room = await prisma.chatRoom.upsert({
    where: {
      dealerOneId_dealerTwoId: {
        dealerOneId,
        dealerTwoId,
      },
    },
    create: {
      dealerOneId,
      dealerTwoId,
    },
    update: {},
  });

  return apiSuccess({ room });
});
