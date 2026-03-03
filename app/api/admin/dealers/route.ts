import { NextResponse } from "next/server";
import { apiSuccess, withApiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
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

  return apiSuccess({ dealers });
});
