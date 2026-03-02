import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const fuel = searchParams.get("fuel")?.trim();
  const year = searchParams.get("year");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "newest";
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || "12");

  const where = {
    isActive: true,
    status: "ACTIVE",
    dealer: { status: "APPROVED", role: "DEALER" },
  } as const;

  const mutableWhere: Record<string, unknown> = { ...where };

  if (q) {
    mutableWhere.OR = [
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }
  if (fuel) mutableWhere.fuel = fuel;
  if (year && /^\d{4}$/.test(year)) mutableWhere.year = Number(year);
  if (minPrice || maxPrice) {
    mutableWhere.price = {
      gte: minPrice ? Number(minPrice) : undefined,
      lte: maxPrice ? Number(maxPrice) : undefined,
    };
  }

  const orderBy =
    sort === "price_asc"
      ? ({ price: "asc" } as const)
      : sort === "price_desc"
        ? ({ price: "desc" } as const)
        : ({ createdAt: "desc" } as const);

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
        select: { id: true, status: true },
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
    verifiedDealer: car.dealer.status === "APPROVED",
    media: car.media,
  }));

  return NextResponse.json({
    cars: normalized,
    nextCursor: hasMore ? normalized[normalized.length - 1]?.id || null : null,
  });
}
