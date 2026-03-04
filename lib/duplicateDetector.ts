import type { PrismaClient, Listing } from "@prisma/client";

export type DuplicateSignal = {
  score: 0 | 60 | 80 | 90 | 100;
  type: "NONE" | "DEALER" | "TITLE" | "IMAGE" | "PLATE";
  listing: Listing | null;
};

export type DuplicateInput = {
  dealerId: string;
  title: string;
  price: number;
  city: string;
  plateNumber?: string | null;
  imageHash?: string | null;
};

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(manual|automatic|petrol|diesel|cng|electric|hybrid)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokenSet(value: string) {
  return new Set(value.split(" ").filter(Boolean));
}

function computeSimilarity(a: string, b: string) {
  if (!a || !b) {
    return 0;
  }

  const left = toTokenSet(a);
  const right = toTokenSet(b);

  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  const denominator = Math.max(left.size, right.size);
  return intersection / denominator;
}

export function normalizePlateNumber(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase().trim();
}

export function extractPlateNumber(text: string) {
  const match = text.match(/\b[A-Z]{1,2}[\s-]?\d{1,2}[\s-]?[A-Z]{0,3}[\s-]?\d{3,4}\b/i);
  if (!match) {
    return "";
  }

  return normalizePlateNumber(match[0]);
}

export async function detectPlateDuplicate(prisma: PrismaClient, plateNumber?: string | null): Promise<DuplicateSignal> {
  const normalized = plateNumber ? normalizePlateNumber(plateNumber) : "";
  if (!normalized) {
    return { score: 0, type: "NONE", listing: null };
  }

  const listing = await prisma.listing.findFirst({
    where: { plateNumber: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!listing) {
    return { score: 0, type: "NONE", listing: null };
  }

  return { score: 100, type: "PLATE", listing };
}

export async function detectTitleDuplicate(
  prisma: PrismaClient,
  title: string,
  price: number,
  city: string
): Promise<DuplicateSignal> {
  const normalizedTargetTitle = normalizeTitle(title);
  const normalizedCity = city.trim().toLowerCase();
  const priceTolerance = Math.max(5000, Math.round(price * 0.03));

  const candidates = await prisma.listing.findMany({
    where: {
      city: {
        equals: city,
        mode: "insensitive",
      },
      price: {
        gte: Math.max(0, price - priceTolerance),
        lte: price + priceTolerance,
      },
      isLive: true,
    },
    take: 25,
    orderBy: { createdAt: "desc" },
  });

  let bestMatch: Listing | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    if (candidate.city.trim().toLowerCase() !== normalizedCity) {
      continue;
    }

    const similarity = computeSimilarity(normalizedTargetTitle, normalizeTitle(candidate.title));
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  if (!bestMatch || bestSimilarity < 0.72) {
    return { score: 0, type: "NONE", listing: null };
  }

  return { score: 80, type: "TITLE", listing: bestMatch };
}

export async function detectImageDuplicate(prisma: PrismaClient, imageHash?: string | null): Promise<DuplicateSignal> {
  const normalized = imageHash?.trim() || "";
  if (!normalized) {
    return { score: 0, type: "NONE", listing: null };
  }

  const listing = await prisma.listing.findFirst({
    where: { imageHash: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!listing) {
    return { score: 0, type: "NONE", listing: null };
  }

  return { score: 90, type: "IMAGE", listing };
}

export async function detectDealerDuplicate(
  prisma: PrismaClient,
  dealerId: string,
  title: string,
  price: number
): Promise<DuplicateSignal> {
  const listing = await prisma.listing.findFirst({
    where: {
      dealerId,
      isLive: true,
      price: {
        gte: Math.max(0, price - 5000),
        lte: price + 5000,
      },
      title: {
        contains: title.trim().split(" ")[0] || title,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!listing) {
    return { score: 0, type: "NONE", listing: null };
  }

  return { score: 60, type: "DEALER", listing };
}

export async function checkDuplicate(prisma: PrismaClient, input: DuplicateInput): Promise<DuplicateSignal> {
  const plate = await detectPlateDuplicate(prisma, input.plateNumber);
  if (plate.score === 100) {
    return plate;
  }

  const image = await detectImageDuplicate(prisma, input.imageHash);
  if (image.score >= 90) {
    return image;
  }

  const [title, dealer] = await Promise.all([
    detectTitleDuplicate(prisma, input.title, input.price, input.city),
    detectDealerDuplicate(prisma, input.dealerId, input.title, input.price),
  ]);

  if (title.score >= dealer.score) {
    return title;
  }

  return dealer;
}
