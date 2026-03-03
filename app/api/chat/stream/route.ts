import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const auth = await requireDealer();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const allowed = await checkRateLimit(`chat:${auth.userId}`, 120, 60 * 1000);
    if (!allowed) {
      return apiError("Too many chat requests", 429);
    }

    const searchParams = new URL(request.url).searchParams;
    const roomId = searchParams.get("roomId");
    const cursor = searchParams.get("cursor");
    if (!roomId) {
      return apiError("roomId required", 400);
    }

    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [{ dealerOneId: auth.userId }, { dealerTwoId: auth.userId }],
      },
      select: { id: true },
    });
    if (!room) {
      return apiError("Room not found", 404);
    }

    let lastMessageId: string | null = cursor;
    let lastMessageCreatedAt = new Date(0);

    if (lastMessageId) {
      const lastMessage = await prisma.chatMessage.findUnique({
        where: { id: lastMessageId },
        select: { id: true, createdAt: true },
      });
      if (lastMessage) {
        lastMessageCreatedAt = lastMessage.createdAt;
        lastMessageId = lastMessage.id;
      } else {
        lastMessageId = null;
      }
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`event: ready\ndata: ${JSON.stringify({ roomId })}\n\n`));

        const interval = setInterval(() => {
          void (async () => {
            try {
              const newMessages = await prisma.chatMessage.findMany({
                where: {
                  roomId,
                  OR: [
                    { createdAt: { gt: lastMessageCreatedAt } },
                    ...(lastMessageId
                      ? [{ createdAt: lastMessageCreatedAt, id: { gt: lastMessageId } }]
                      : []),
                  ],
                },
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                take: 25,
              });

              for (const message of newMessages) {
                lastMessageCreatedAt = message.createdAt;
                lastMessageId = message.id;
                controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`));
              }
            } catch (error) {
              console.error("SSE stream polling failed:", error);
            }
          })();
        }, 1500);

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        }, 15000);

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          clearInterval(keepAlive);
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const nextError = error as { digest?: string; message?: string };
    if (nextError.digest?.includes("DYNAMIC_SERVER_USAGE") || nextError.message?.includes("Dynamic server usage")) {
      throw error;
    }
    console.error("Chat stream initialization failed:", error);
    return apiError("Internal server error", 500);
  }
};
