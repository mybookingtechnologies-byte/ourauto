import { BoostType, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { checkDuplicate, normalizePlateNumber } from "@/lib/duplicateDetector";
import { verifyCsrf } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";
import { logActivity } from "@/lib/activityLog";
import { applyReputationChange, detectFakePricePenalty, getReputationRestrictions } from "@/lib/reputation";
import { listingCreateSchema } from "@/lib/validation";
import { getOrSetCache, invalidateCache } from "@/lib/cache";

const allowedBoostTypes: BoostType[] = ["NORMAL", "HOT_DEAL", "FUTURE_AD"];
const allowedTransmissions = ["Manual", "Automatic"] as const;

function asTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function asOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function resolveBoostType(rawBoostType?: BoostType) {
  if (!rawBoostType || !allowedBoostTypes.includes(rawBoostType)) {
    return "NORMAL" as BoostType;
  }

  return rawBoostType;
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined;

  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId")?.trim();
    const page = Math.max(Number(searchParams.get("page") || 0), 0);
    const take = Math.min(Math.max(Number(searchParams.get("take") || 20), 1), 50);
    const skip = page * take;

    if (dealerId) {
      const user = await getUserFromRequest(request);
      if (!user) {
        return fail("Unauthorized", 401);
      }

      if (user.id !== dealerId) {
        return fail("Forbidden", 403);
      }

      const listings = await getOrSetCache(`listings:dealer:${dealerId}:p${page}:t${take}`, 45_000, async () => {
        return prisma.listing.findMany({
          where: { dealerId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take,
          skip,
        });
      });

      return ok({ listings, page, take }, 200);
    }

    const marketplaceListings = await getOrSetCache(`listings:marketplace:p${page}:t${take}`, 45_000, async () => {
      return prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          price: number;
          city: string;
          dealerId: string;
          boostType: BoostType;
          isLive: boolean;
          createdAt: Date;
          dealerName: string;
        }>
      >(Prisma.sql`
        SELECT
          l."id",
          l."title",
          l."price",
          l."city",
          l."dealerId",
          l."boostType",
          l."isLive",
          l."createdAt",
          u."dealerName"
        FROM "Listing" l
        INNER JOIN "User" u ON u."id" = l."dealerId"
        WHERE l."isLive" = true
        ORDER BY
          CASE
            WHEN l."boostType" = 'HOT_DEAL' THEN 1
            WHEN l."boostType" = 'FUTURE_AD' THEN 2
            ELSE 3
          END,
          l."createdAt" DESC,
          l."id" DESC
        LIMIT ${take}
        OFFSET ${skip}
      `);
    });

    return ok({ listings: marketplaceListings, page, take }, 200);
  } catch (error) {
    logError("fetch_listings_error", error, { requestId });
    return fail("Unable to load listings", 500);
  }
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined;

  try {
    if (await isRateLimited(request, "listing-create", 10, 60_000)) {
      return fail("Too many listing attempts. Try again shortly.", 429);
    }

    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const parsed = listingCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail("Invalid listing payload", 400);
    }

    const body = parsed.data;

    const title = asTrimmedString(body.title);
    const city = asTrimmedString(body.city);
    const description = asTrimmedString(body.description);
    const dealerIdFromBody = asTrimmedString(body.dealerId);
    const dealerId = user.id;
    const price = Number(body.price);
    const fuel = asOptionalTrimmedString(body.fuel);
    const owner = asOptionalTrimmedString(body.owner);
    const colour = asOptionalTrimmedString(body.colour);
    const insuranceType = asOptionalTrimmedString(body.insuranceType);
    const insuranceTillRaw = asOptionalTrimmedString(body.insuranceTill);
    const insuranceTill = insuranceTillRaw ? new Date(insuranceTillRaw) : null;
    const remarks = asOptionalTrimmedString(body.remarks);
    const transmission = asOptionalTrimmedString(body.transmission) || "Manual";
    const plateNumberRaw = asOptionalTrimmedString(body.plateNumber);
    const imageHash = asOptionalTrimmedString(body.imageHash);
    const plateNumber = plateNumberRaw ? normalizePlateNumber(plateNumberRaw) : null;
    const kmRaw = body.km;
    const km = typeof kmRaw === "number" ? Math.trunc(kmRaw) : Number(kmRaw);
    const images = body.images.map((image) => image.trim());

    if (dealerIdFromBody && dealerIdFromBody !== dealerId) {
      return fail("Forbidden", 403);
    }

    if (!title || !city || Number.isNaN(price) || price <= 0) {
      return fail("title, price and city are required", 400);
    }

    if (!allowedTransmissions.includes(transmission as (typeof allowedTransmissions)[number])) {
      return fail("Invalid transmission", 400);
    }

    if (!Number.isNaN(km) && (km < 0 || km > 999999)) {
      return fail("Invalid km", 400);
    }

    if (insuranceTillRaw && (!insuranceTill || Number.isNaN(insuranceTill.getTime()))) {
      return fail("Invalid insurance till date", 400);
    }

    // PHOTO VALIDATION
    if (!images || images.length < 3) {
      return fail("Minimum 3 photos required", 400);
    }

    if (images.length > 10) {
      return fail("Maximum 10 photos allowed", 400);
    }

    // DESCRIPTION VALIDATION
    if (!description || description.trim().length === 0) {
      return fail("Car description is required", 400);
    }

    if (images.some((image) => !image.startsWith("/uploads/"))) {
      return fail("Invalid image paths", 400);
    }

    const requestedBoostType = resolveBoostType(body.boostType);
    const duplicateSignal = await checkDuplicate(prisma, {
      dealerId,
      title,
      price,
      city,
      plateNumber,
      imageHash,
    });
    const fakePriceDetected = await detectFakePricePenalty(prisma, dealerId, title, city, price);

    const spamWindowStart = new Date(Date.now() - 15 * 60 * 1000);
    const recentSimilarCount = await prisma.listing.count({
      where: {
        dealerId,
        createdAt: {
          gte: spamWindowStart,
        },
        title: {
          equals: title,
          mode: "insensitive",
        },
        price: {
          gte: Math.max(0, price - 5000),
          lte: price + 5000,
        },
      },
    });

    if (recentSimilarCount >= 3) {
      return fail("Potential listing spam detected. Please wait before reposting similar cars.", 429);
    }

    const listingResult = await prisma.$transaction(async (tx) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);

      let appliedBoostType: BoostType = requestedBoostType;

      const dealer = await tx.user.findUnique({
        where: { id: dealerId },
        select: {
          id: true,
          hotDealCredits: true,
          futureAdCredits: true,
          hasUnlockedHotDealReward: true,
          reputationScore: true,
          duplicateCount: true,
        },
      });

      if (!dealer) {
        throw new Error("DEALER_NOT_FOUND");
      }

      const restrictions = getReputationRestrictions(dealer.reputationScore);
      if (restrictions.suspended) {
        throw new Error("DEALER_SUSPENDED");
      }

      if (restrictions.disableBoosts && requestedBoostType !== "NORMAL") {
        appliedBoostType = "NORMAL";
      }

      const dailyCount = await tx.listing.count({
        where: {
          dealerId,
          createdAt: { gte: dayStart },
        },
      });

      if (dailyCount >= restrictions.dailyLimit) {
        throw new Error("DAILY_LIMIT_REACHED");
      }

      if (dailyCount >= 15) {
        await applyReputationChange(tx, {
          dealerId,
          reason: "SPAM_POSTING",
          scoreChange: -10,
          spamIncrement: 1,
        });
      }

      if (requestedBoostType === "HOT_DEAL") {
        const deduction = await tx.user.updateMany({
          where: { id: dealerId, hotDealCredits: { gte: 1 } },
          data: { hotDealCredits: { decrement: 1 } },
        });

        if (deduction.count === 0) {
          appliedBoostType = "NORMAL";
        }
      }

      if (requestedBoostType === "FUTURE_AD") {
        const deduction = await tx.user.updateMany({
          where: { id: dealerId, futureAdCredits: { gte: 1 } },
          data: { futureAdCredits: { decrement: 1 } },
        });

        if (deduction.count === 0) {
          appliedBoostType = "NORMAL";
        }
      }

      const created = await tx.listing.create({
        data: {
          title,
          price,
          city,
          dealerId,
          fuel,
          km: Number.isNaN(km) ? null : km,
          owner,
          colour,
          transmission,
          insuranceType,
          insuranceTill,
          remarks,
          images,
          plateNumber,
          imageHash,
          boostType: appliedBoostType,
          isLive: true,
        },
      });

      await tx.user.update({
        where: { id: dealerId },
        data: {
          totalListings: {
            increment: 1,
          },
        },
      });

      if (duplicateSignal.score >= 60) {
        await tx.user.update({
          where: { id: dealerId },
          data: {
            duplicateListings: {
              increment: 1,
            },
          },
        });

        await applyReputationChange(tx, {
          dealerId,
          reason: "DUPLICATE_LISTING",
          scoreChange: -5,
          duplicateIncrement: 1,
        });

        const nextDuplicateCount = dealer.duplicateCount + 1;
        if (nextDuplicateCount % 5 === 0) {
          await applyReputationChange(tx, {
            dealerId,
            reason: "DUPLICATE_LISTING",
            scoreChange: -30,
          });
        }
      }

      if (fakePriceDetected) {
        await applyReputationChange(tx, {
          dealerId,
          reason: "FAKE_PRICE",
          scoreChange: -20,
        });
      }

      const totalSuccessfulListings = await tx.listing.count({
        where: {
          dealerId,
          deletedByAdmin: false,
        },
      });

      if (totalSuccessfulListings > 0 && totalSuccessfulListings % 10 === 0) {
        await applyReputationChange(tx, {
          dealerId,
          reason: "GOOD_ACTIVITY",
          scoreChange: 3,
        });
      }

      const liveCount = await tx.listing.count({ where: { dealerId, isLive: true } });
      if (liveCount >= 10) {
        await tx.user.updateMany({
          where: { id: dealerId, hasUnlockedHotDealReward: false },
          data: {
            hasUnlockedHotDealReward: true,
            hotDealCredits: { increment: 1 },
          },
        });
      }

      return {
        listing: created,
        appliedBoostType,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await logActivity(dealerId, "CREATE_LISTING", {
      listingId: listingResult.listing.id,
      boostType: listingResult.appliedBoostType,
    });

    invalidateCache("listings:");
    invalidateCache("public-stats");
    invalidateCache("admin-stats");

    return ok(
      {
        listing: listingResult.listing,
        appliedBoostType: listingResult.appliedBoostType,
        fallbackToNormal: requestedBoostType !== listingResult.appliedBoostType,
        duplicateScore: duplicateSignal.score,
        duplicateType: duplicateSignal.type,
        duplicateListing: duplicateSignal.listing,
        duplicateWarning: duplicateSignal.score >= 60,
        duplicateMessage: duplicateSignal.score >= 60 ? "Possible duplicate listing" : "",
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_LIMIT_REACHED") {
      return fail("Daily listing limit reached (10/day)", 429);
    }

    if (error instanceof Error && error.message === "DEALER_NOT_FOUND") {
      return fail("Dealer not found", 404);
    }

    if (error instanceof Error && error.message === "DEALER_SUSPENDED") {
      return fail("Dealer account suspended due to low trust score", 403);
    }

    logError("create_listing_error", error, { requestId });
    return fail("Unable to create listing", 500);
  }
}
