import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  await prisma.$queryRaw`SELECT 1`;

  return NextResponse.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
