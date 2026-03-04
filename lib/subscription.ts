import { prisma } from "@/lib/prisma";

export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

const PLAN_LIMITS: Record<PlanTier, number> = {
  FREE: 5,
  PRO: 50,
  ENTERPRISE: Number.MAX_SAFE_INTEGER,
};

export function normalizePlan(planName: string | null | undefined): PlanTier {
  const value = (planName || "FREE").toUpperCase();
  if (value === "PRO") {
    return "PRO";
  }
  if (value === "ENTERPRISE") {
    return "ENTERPRISE";
  }
  return "FREE";
}

export async function getActiveDealerPlan(userId: string): Promise<PlanTier> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      isActive: true,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { planName: true },
  });

  return normalizePlan(subscription?.planName);
}

export function getListingLimitForPlan(plan: PlanTier): number {
  return PLAN_LIMITS[plan];
}
