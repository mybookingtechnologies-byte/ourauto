import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { getPlatformConfig, isFutureAdActive, isHotDealActive } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { createCarSchema } from "@/lib/validators";

export const GET = withApiHandler(async (_request: NextRequest): Promise<NextResponse> => {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const now = new Date();
  await Promise.all([
    prisma.car.updateMany({
      where: {
        dealerId: auth.userId,
        isHotDeal: true,
        hotDealUntil: { lte: now },
      },
      data: {
        isHotDeal: false,
      },
    }),
    prisma.car.updateMany({
      where: {
        dealerId: auth.userId,
        isFutureAd: true,
        futureAdUntil: { lte: now },
      },
      data: {
        isFutureAd: false,
      },
    }),
  ]);

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

  const body = await request.json();
  const parsed = createCarSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid car data", 400);
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
      title: parsed.data.title,
      description: parsed.data.description,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year,
      km: parsed.data.km,
      fuel: parsed.data.fuel,
      ownerCount: parsed.data.ownerCount,
      price: parsed.data.price,
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
  } catch {}

  return apiSuccess({ car: created });
});
