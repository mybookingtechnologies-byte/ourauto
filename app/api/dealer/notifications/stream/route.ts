import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const auth = await requireDealer();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const allowed = await checkRateLimit(`notif-stream:${auth.userId}`, 120, 60 * 1000);
    if (!allowed) {
      return apiError("Too many notification requests", 429);
    }

    const cursor = new URL(request.url).searchParams.get("cursor");
    let lastNotificationId: string | null = cursor;
    let lastCreatedAt = new Date(0);

    if (lastNotificationId) {
      const last = await prisma.notification.findFirst({
        where: { id: lastNotificationId, userId: auth.userId },
        select: { id: true, createdAt: true },
      });
      if (last) {
        lastNotificationId = last.id;
        lastCreatedAt = last.createdAt;
      } else {
        lastNotificationId = null;
      }
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`));

        const poll = setInterval(() => {
          void (async () => {
            try {
              const notifications = await prisma.notification.findMany({
                where: {
                  userId: auth.userId,
                  OR: [
                    { createdAt: { gt: lastCreatedAt } },
                    ...(lastNotificationId ? [{ createdAt: lastCreatedAt, id: { gt: lastNotificationId } }] : []),
                  ],
                },
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                take: 25,
              });

              for (const notification of notifications) {
                lastCreatedAt = notification.createdAt;
                lastNotificationId = notification.id;
                controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`));
              }
            } catch (error) {
              logger.error("Notification stream polling failed", {
                error: error instanceof Error ? error.message : "unknown",
              });
            }
          })();
        }, 1500);

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        }, 15000);

        request.signal.addEventListener("abort", () => {
          clearInterval(poll);
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
    logger.error("Notification stream initialization failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError("Internal server error", 500);
  }
};
