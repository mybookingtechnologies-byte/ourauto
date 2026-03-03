import { prisma } from "@/lib/prisma";

export async function getPlatformConfig(): Promise<{ hotDealMilestone: number; referralReward: number }> {
  const config = await prisma.platformConfig.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      hotDealMilestone: 10,
      referralReward: 5,
    },
    select: {
      hotDealMilestone: true,
      referralReward: true,
    },
  });

  return config;
}

export function isHotDealActive(car: { isHotDeal: boolean; hotDealUntil: Date | null }, now: Date = new Date()): boolean {
  return car.isHotDeal && !!car.hotDealUntil && car.hotDealUntil > now;
}

export function isFutureAdActive(car: { isFutureAd: boolean; futureAdUntil: Date | null }, now: Date = new Date()): boolean {
  return car.isFutureAd && !!car.futureAdUntil && car.futureAdUntil > now;
}
