import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/apiAuth";
import { extractPlateNumber } from "@/lib/ocr";
import { prisma } from "@/lib/prisma";
import { createCarSchema } from "@/lib/validators";

export async function GET(): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const cars = await prisma.car.findMany({
    where: { dealerId: auth.userId },
    orderBy: { createdAt: "desc" },
    include: {
      media: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({ cars });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const parsed = createCarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid car data" }, { status: 400 });
  }

  const primaryImage = parsed.data.media.find((item) => item.order === 0)?.url || parsed.data.media[0]?.url;
  const ocrPlate = primaryImage ? await extractPlateNumber(primaryImage) : null;
  const manualPlate = parsed.data.plateNumber?.toUpperCase().replace(/\s+/g, "") || null;
  const finalPlate = ocrPlate || manualPlate;

  if (finalPlate) {
    const duplicate = await prisma.car.findFirst({
      where: {
        dealerId: auth.userId,
        plateNumber: finalPlate,
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Duplicate plate number for dealer" }, { status: 409 });
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

  return NextResponse.json({ car: created });
}
