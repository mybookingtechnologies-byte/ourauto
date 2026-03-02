import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { dealerCarPatchSchema } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const parsed = dealerCarPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.car.findFirst({ where: { id: params.id, dealerId: auth.userId } });
  if (!existing) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  if (parsed.data.action === "sold") {
    await prisma.car.update({ where: { id: params.id }, data: { status: "SOLD", isActive: false } });
    return NextResponse.json({ ok: true });
  }

  await prisma.car.update({
    where: { id: params.id },
    data: {
      title: parsed.data.title ?? existing.title,
      city: parsed.data.city ?? existing.city,
      price: parsed.data.price ?? existing.price,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const existing = await prisma.car.findFirst({ where: { id: params.id, dealerId: auth.userId } });
  if (!existing) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  await prisma.car.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
