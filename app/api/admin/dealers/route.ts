import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

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
      city: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ dealers });
}
