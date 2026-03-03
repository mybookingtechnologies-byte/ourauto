import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { adminDealerStatusSchema } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = await request.json();
  const parsed = adminDealerStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const dealer = await prisma.user.findFirst({
    where: { id: params.id, role: "DEALER" },
    select: { id: true },
  });

  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
