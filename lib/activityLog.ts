import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type ActivityAction =
  | "SIGNUP"
  | "LOGIN"
  | "CREATE_LISTING"
  | "DELETE_LISTING"
  | "ADMIN_DELETE_LISTING"
  | "ADD_HOT_DEAL_CREDIT"
  | "ADD_FUTURE_AD_CREDIT";

export async function logActivity(userId: string, action: ActivityAction, metadata?: Record<string, unknown>) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        metadata: (metadata || undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Keep activity logging best-effort and non-blocking.
  }
}
