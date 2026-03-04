import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { enqueueNotificationJob } from "@/lib/queue";

type WebhookEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

const PLAN_DAYS: Record<string, number> = {
  FREE: 30,
  PRO: 30,
  ENTERPRISE: 30,
};

function normalizePlan(plan: string | undefined): "FREE" | "PRO" | "ENTERPRISE" {
  if (plan === "PRO" || plan === "ENTERPRISE") {
    return plan;
  }
  return "FREE";
}

function addDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

async function handlePaymentSuccess(payload?: Record<string, unknown>): Promise<void> {
  const paymentEntity = (payload?.payment as { entity?: Record<string, unknown> } | undefined)?.entity;
  const notes = (paymentEntity?.notes as Record<string, unknown> | undefined) || {};
  const userIdValue = notes.userId;

  if (typeof userIdValue !== "string") {
    return;
  }

  const plan = normalizePlan(typeof notes.plan === "string" ? notes.plan.toUpperCase() : undefined);
  const amountPaise = Number(paymentEntity?.amount ?? 0);
  const amount = Number.isFinite(amountPaise) ? amountPaise / 100 : 0;
  logger.info("Handling payment success webhook", { userId: userIdValue, plan, amount });

  const startsAt = new Date();
  const expiresAt = addDays(startsAt, PLAN_DAYS[plan] ?? 30);

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { userId: userIdValue, isActive: true },
      data: { isActive: false },
    }),
    prisma.subscription.create({
      data: {
        userId: userIdValue,
        planName: plan,
        amount,
        startsAt,
        expiresAt,
        isActive: true,
      },
    }),
  ]);

  await writeAuditLog({
    actorUserId: userIdValue,
    action: "SYSTEM_WEBHOOK_PAYMENT",
    targetType: "Subscription",
    metadata: {
      plan,
      amount,
      expiresAt: expiresAt.toISOString(),
    },
  });

  await enqueueNotificationJob(
    userIdValue,
    "Subscription Activated",
    `Your ${plan} plan is now active until ${expiresAt.toDateString()}`,
    { plan, expiresAt: expiresAt.toISOString() },
  );
}

async function handleDealerApproved(payload?: Record<string, unknown>): Promise<void> {
  const userId = payload?.userId;
  if (typeof userId !== "string") {
    return;
  }

  await enqueueNotificationJob(userId, "Dealer Approved", "Your dealer profile is approved. You can now publish listings.", {
    eventType: "dealer.approved",
  });
  logger.info("Handled dealer approved webhook", { userId });
}

export async function handleWebhook(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case "payment.success":
    case "payment.captured":
      await handlePaymentSuccess(event.payload);
      break;
    case "dealer.approved":
      await handleDealerApproved(event.payload);
      break;
    default:
      break;
  }
}
