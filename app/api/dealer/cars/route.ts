import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { logger } from "@/lib/logger";
import { meili } from "@/lib/meili";
import { getPlatformConfig, isFutureAdActive, isHotDealActive } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";
import { enqueueCompressImageJob } from "@/lib/queue";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { redis } from "@/lib/redis";
import { getActiveDealerPlan, getListingLimitForPlan } from "@/lib/subscription";
import { createCarSchema } from "@/lib/validators";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const now = new Date();
  const cars = await prisma.car.findMany({
    where: { dealerId: auth.userId },
    orderBy: [{ isHotDeal: "desc" }, { isFutureAd: "desc" }, { createdAt: "desc" }],
    include: {
      media: { orderBy: { order: "asc" } },
    },
  });

  const normalizedCars = cars.map((car) => ({
    ...car,
    isHotDeal: isHotDealActive(car, now),
    isFutureAd: isFutureAdActive(car, now),
  }));

  return apiSuccess({ cars: normalizedCars });
});

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const allowed = await checkRateLimit(`publish:${auth.userId}`, 20, 24 * 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const [plan, totalListings] = await Promise.all([
    getActiveDealerPlan(auth.userId),
    prisma.car.count({ where: { dealerId: auth.userId } }),
  ]);
  const listingLimit = getListingLimitForPlan(plan);
  if (totalListings >= listingLimit) {
    return apiError("Upgrade plan required", 403);
  }

  const body = await request.json();
  const parsed = createCarSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid car data", 400);
  }

  const title = parsed.data.title.trim();
  const description = parsed.data.description?.trim();
  const year = parsed.data.year;
  const km = parsed.data.km;
  const ownerCount = parsed.data.ownerCount;
  const price = parsed.data.price;

  if (!Number.isInteger(year) || year < 1980 || year > 2100) {
    return apiError("Invalid year", 400);
  }
  if (!Number.isInteger(km) || km < 0) {
    return apiError("Invalid km", 400);
  }
  if (ownerCount !== undefined && (!Number.isInteger(ownerCount) || ownerCount < 0 || ownerCount > 10)) {
    return apiError("Invalid owner count", 400);
  }
  if (!Number.isFinite(price) || price <= 0) {
    return apiError("Invalid price", 400);
  }

  const manualPlate = parsed.data.plateNumber?.toUpperCase().replace(/\s+/g, "") || null;
  const finalPlate = manualPlate;

  if (finalPlate) {
    const duplicate = await prisma.car.findFirst({
      where: {
        dealerId: auth.userId,
        plateNumber: finalPlate,
      },
    });
    if (duplicate) {
      return apiError("Duplicate plate number for dealer", 409);
    }
  }

  const created = await prisma.car.create({
    data: {
      dealerId: auth.userId,
      title,
      description,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year,
      km,
      fuel: parsed.data.fuel,
      ownerCount,
      price,
      city: parsed.data.city,
      isUrgent: parsed.data.isUrgent || false,
      plateNumber: finalPlate,
      media: {
        create: parsed.data.media.map((item, index) => ({
          url: item.url,
          order: item.order,
          isMain: index === 0,
        })),
      },
    },
  });

  await writeAuditLog({
    actorUserId: auth.userId,
    action: "DEALER_CREATE_CAR",
    targetType: "Car",
    targetId: created.id,
  });

  try {
    const config = await getPlatformConfig();
    const updatedDealer = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        totalListings: {
          increment: 1,
        },
      },
      select: {
        totalListings: true,
      },
    });

    if (updatedDealer.totalListings % config.hotDealMilestone === 0) {
      await prisma.user.update({
        where: { id: auth.userId },
        data: {
          hotDealCredits: {
            increment: 1,
          },
        },
      });
    }
  } catch (error) {
    logger.error("Post publish milestone failed", {
      userId: auth.userId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    await redis?.del(`car:${created.id}`);
  } catch {
    // Ignore cache invalidation errors.
  }

  if (meili) {
    try {
      await meili.index("cars").addDocuments([
        {
          id: created.id,
          title: created.title,
          city: created.city,
          fuel: created.fuel,
          price: Number(created.price),
        },
      ]);
    } catch {
      // Ignore search index sync errors.
    }
  }

  void enqueueCompressImageJob(created.id);

  return apiSuccess({ car: created });
});
