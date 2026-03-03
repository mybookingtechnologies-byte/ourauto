import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendMessageSchema } from "@/lib/validators";

const MAX_LIMIT = 50;

export const GET = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const searchParams = new URL(request.url).searchParams;
  const roomId = searchParams.get("roomId");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") || "30")));

  if (!roomId) {
    return apiError("roomId required", 400);
  }

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      OR: [{ dealerOneId: auth.userId }, { dealerTwoId: auth.userId }],
    },
  });
  if (!room) {
    return apiError("Room not found", 404);
  }

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = messages.length > limit;
  const sliced = messages.slice(0, limit);

  return apiSuccess({
    messages: sliced.reverse(),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id || null : null,
  });
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

  const allowed = await checkRateLimit(`chat:${auth.userId}`, 40, 60 * 1000);
  if (!allowed) {
    return apiError("Too many chat requests", 429);
  }

  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid message payload", 400);
  }

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: parsed.data.roomId,
      OR: [{ dealerOneId: auth.userId }, { dealerTwoId: auth.userId }],
    },
  });
  if (!room) {
    return apiError("Room not found", 404);
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId: parsed.data.roomId,
      senderId: auth.userId,
      message: parsed.data.message,
    },
  });

  return apiSuccess({ message });
});
