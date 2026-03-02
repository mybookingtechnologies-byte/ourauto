import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { adminDealerActionSchema } from "@/lib/validators";

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const dealers = await prisma.user.findMany({
    where: { role: "DEALER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      dealerName: true,
      businessName: true,
      email: true,
      mobile: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ dealers });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = await request.json();
  const parsed = adminDealerActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.action === "DELETE") {
    await prisma.user.delete({ where: { id: parsed.data.userId } });
    return NextResponse.json({ ok: true });
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.action },
  });

  return NextResponse.json({ ok: true });
}
