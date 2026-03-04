import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { meili } from "@/lib/meili";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { dealerCarPatchSchema } from "@/lib/validators";

export const PATCH = withApiHandler(async (request: NextRequest, { params }: { params?: Record<string, string> } = {}): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  if (!params?.id) {
    return apiError("Missing car id", 400);
  }

  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const parsed = dealerCarPatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const existing = await prisma.car.findFirst({ where: { id: params.id, dealerId: auth.userId } });
  if (!existing) {
    return apiError("Car not found", 404);
  }

  if (parsed.data.action === "sold") {
    await prisma.car.update({ where: { id: params.id }, data: { status: "SOLD", isActive: false } });
    try {
      await redis?.del(`car:${params.id}`);
    } catch {
      // Ignore cache invalidation errors.
    }
    if (meili) {
      try {
        await meili.index("cars").deleteDocument(params.id);
      } catch {
        // Ignore search index sync errors.
      }
    }
    await writeAuditLog({
      actorUserId: auth.userId,
      action: "DEALER_MARK_CAR_SOLD",
      targetType: "Car",
      targetId: params.id,
    });
    return apiSuccess({});
  }

  const updated = await prisma.car.update({
    where: { id: params.id },
    data: {
      title: parsed.data.title ?? existing.title,
      city: parsed.data.city ?? existing.city,
      price: parsed.data.price ?? existing.price,
    },
  });

  try {
    await redis?.del(`car:${params.id}`);
  } catch {
    // Ignore cache invalidation errors.
  }

  if (meili) {
    try {
      await meili.index("cars").addDocuments([
        {
          id: updated.id,
          title: updated.title,
          city: updated.city,
          fuel: updated.fuel,
          price: Number(updated.price),
        },
      ]);
    } catch {
      // Ignore search index sync errors.
    }
  }

  await writeAuditLog({
    actorUserId: auth.userId,
    action: "DEALER_UPDATE_CAR",
    targetType: "Car",
    targetId: params.id,
  });

  return apiSuccess({});
});

export const DELETE = withApiHandler(async (request: NextRequest, { params }: { params?: Record<string, string> } = {}): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  if (!params?.id) {
    return apiError("Missing car id", 400);
  }

  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const existing = await prisma.car.findFirst({ where: { id: params.id, dealerId: auth.userId } });
  if (!existing) {
    return apiError("Car not found", 404);
  }

  await prisma.car.delete({ where: { id: params.id } });
  try {
    await redis?.del(`car:${params.id}`);
  } catch {
    // Ignore cache invalidation errors.
  }
  if (meili) {
    try {
      await meili.index("cars").deleteDocument(params.id);
    } catch {
      // Ignore search index sync errors.
    }
  }
  await writeAuditLog({
    actorUserId: auth.userId,
    action: "DEALER_DELETE_CAR",
    targetType: "Car",
    targetId: params.id,
  });

  return apiSuccess({});
});
