import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiError, apiSuccess, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 50;

export const GET = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().slice(0, 80);
  const fuel = searchParams.get("fuel")?.trim();
  const year = searchParams.get("year");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const cursor = searchParams.get("cursor");
  const parsedLimit = Number(searchParams.get("limit") || "12");
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 12));

  if (fuel && !["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID", "OTHER"].includes(fuel)) {
    return apiError("Invalid fuel type", 400);
  }

  const now = new Date();
  const mutableWhere: Prisma.CarWhereInput = {
    isActive: true,
    status: "ACTIVE",
    dealer: { status: "APPROVED", role: "DEALER" },
    OR: [
      {
        isHotDeal: true,
        hotDealUntil: { gt: now },
      },
      {
        isFutureAd: true,
        futureAdUntil: { gt: now },
      },
      {
        isHotDeal: false,
        isFutureAd: false,
      },
    ],
  };

  if (q) {
    mutableWhere.AND = [
      {
        OR: [
          { brand: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }
  if (fuel) mutableWhere.fuel = fuel as never;
  if (year && /^\d{4}$/.test(year)) mutableWhere.year = Number(year);
  if (minPrice || maxPrice) {
    mutableWhere.price = {
      gte: minPrice ? Number(minPrice) : undefined,
      lte: maxPrice ? Number(maxPrice) : undefined,
    };
  }
  const orderBy: Prisma.CarOrderByWithRelationInput[] = [{ isHotDeal: "desc" }, { isFutureAd: "desc" }, { createdAt: "desc" }];

  const cars = await prisma.car.findMany({
    where: mutableWhere,
    orderBy,
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    include: {
      media: {
        orderBy: { order: "asc" },
        select: { id: true, url: true },
      },
      dealer: {
        select: { status: true },
      },
    },
  });

  const hasMore = cars.length > limit;
  const normalized = cars.slice(0, limit).map((car: (typeof cars)[number]) => ({
    id: car.id,
    title: car.title,
    brand: car.brand,
    model: car.model,
    year: car.year,
    km: car.km,
    fuel: car.fuel,
    city: car.city,
    price: car.price.toString(),
    isUrgent: car.isUrgent,
    isHotDeal: car.isHotDeal && !!car.hotDealUntil && car.hotDealUntil > now,
    isFutureAd: car.isFutureAd && !!car.futureAdUntil && car.futureAdUntil > now,
    verifiedDealer: car.dealer.status === "APPROVED",
    media: car.media,
  }));

  return apiSuccess({
    cars: normalized,
    nextCursor: hasMore ? normalized[normalized.length - 1]?.id || null : null,
  });
});
