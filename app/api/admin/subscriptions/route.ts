import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { adminSubscriptionCreateSchema, adminSubscriptionUpdateSchema } from "@/lib/validators";

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ subscriptions });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = await request.json();
  const parsed = adminSubscriptionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const created = await prisma.subscription.create({
    data: {
      userId: parsed.data.userId,
      planName: parsed.data.planName,
      amount: parsed.data.amount,
      startsAt: new Date(parsed.data.startsAt),
      expiresAt: new Date(parsed.data.expiresAt),
      isActive: true,
    },
  });

  return NextResponse.json({ subscription: created });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = await request.json();
  const parsed = adminSubscriptionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.subscription.update({
    where: { id: parsed.data.id },
    data: {
      planName: parsed.data.planName,
      amount: parsed.data.amount,
      isActive: parsed.data.isActive,
    },
  });

  return NextResponse.json({ ok: true });
}
