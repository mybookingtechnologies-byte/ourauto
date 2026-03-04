import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    if (await isRateLimited(request, "dealer-messages", 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const messages = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        createdAt: true,
      },
    });

    return ok({
      conversations: messages.map((message) => ({
        id: message.id,
        name: message.action.replaceAll("_", " "),
        preview: `System event: ${message.action}`,
        time: message.createdAt.toISOString(),
      })),
      chat: messages.slice(0, 10).map((message, index) => ({
        id: message.id,
        fromDealer: index % 2 === 0,
        text: `Activity: ${message.action}`,
      })),
    });
  } catch (error) {
    logError("dealer_messages_error", error);
    return fail("Unable to load messages", 500);
  }
}
