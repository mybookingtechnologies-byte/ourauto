import type { Prisma, PrismaClient } from "@prisma/client";

export type ReputationReason =
  | "DUPLICATE_LISTING"
  | "FAKE_PRICE"
  | "SPAM_POSTING"
  | "ADMIN_DELETE"
  | "GOOD_ACTIVITY";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

type ApplyReputationInput = {
  dealerId: string;
  reason: ReputationReason;
  scoreChange: number;
  duplicateIncrement?: number;
  spamIncrement?: number;
  adminDeleteIncrement?: number;
};

export type ReputationRestrictions = {
  suspended: boolean;
  disableBoosts: boolean;
  dailyLimit: number;
};

function clampScore(value: number) {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

export function getReputationRestrictions(score: number): ReputationRestrictions {
  if (score < 10) {
    return {
      suspended: true,
      disableBoosts: true,
      dailyLimit: 0,
    };
  }

  if (score < 25) {
    return {
      suspended: false,
      disableBoosts: true,
      dailyLimit: 3,
    };
  }

  if (score < 40) {
    return {
      suspended: false,
      disableBoosts: true,
      dailyLimit: 10,
    };
  }

  return {
    suspended: false,
    disableBoosts: false,
    dailyLimit: 10,
  };
}

export async function applyReputationChange(prisma: PrismaLike, input: ApplyReputationInput) {
  const dealer = await prisma.user.findUnique({
    where: { id: input.dealerId },
    select: {
      id: true,
      reputationScore: true,
    },
  });

  if (!dealer) {
    return null;
  }

  const nextScore = clampScore(dealer.reputationScore + input.scoreChange);

  const updatedDealer = await prisma.user.update({
    where: { id: input.dealerId },
    data: {
      reputationScore: nextScore,
      duplicateCount: {
        increment: input.duplicateIncrement || 0,
      },
      spamCount: {
        increment: input.spamIncrement || 0,
      },
      adminDeletes: {
        increment: input.adminDeleteIncrement || 0,
      },
    },
    select: {
      id: true,
      reputationScore: true,
      duplicateCount: true,
      spamCount: true,
      adminDeletes: true,
    },
  });

  await prisma.reputationLog.create({
    data: {
      dealerId: input.dealerId,
      reason: input.reason,
      scoreChange: input.scoreChange,
    },
  });

  return updatedDealer;
}

export async function detectFakePricePenalty(prisma: PrismaLike, dealerId: string, title: string, city: string, price: number) {
  const titleToken = title.trim().split(" ").find(Boolean);
  if (!titleToken) {
    return false;
  }

  const similarListings = await prisma.listing.findMany({
    where: {
      dealerId: {
        not: dealerId,
      },
      city: {
        equals: city,
        mode: "insensitive",
      },
      isLive: true,
      title: {
        contains: titleToken,
        mode: "insensitive",
      },
    },
    select: {
      price: true,
    },
    take: 50,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (similarListings.length < 5) {
    return false;
  }

  const avg = similarListings.reduce((sum, item) => sum + item.price, 0) / similarListings.length;

  return price < avg * 0.4;
}
