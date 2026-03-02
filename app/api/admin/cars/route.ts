import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { adminCarActionSchema } from "@/lib/validators";

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const cars = await prisma.car.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dealer: { select: { dealerName: true, businessName: true } },
    },
    take: 100,
  });

  return NextResponse.json({ cars });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = await request.json();
  const parsed = adminCarActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.action === "DELETE") {
    await prisma.car.delete({ where: { id: parsed.data.carId } });
  }
  if (parsed.data.action === "FEATURE") {
    await prisma.car.update({ where: { id: parsed.data.carId }, data: { isFeatured: true } });
  }

  return NextResponse.json({ ok: true });
}
