import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireDealer(): Promise<{ userId: string } | NextResponse> {
  const token = cookies().get("ourauto_token")?.value;
  if (!token) {
    return apiError("Unauthorized", 401);
  }
  const session = await verifyToken(token);
  if (!session || session.role !== "DEALER") {
    return apiError("Forbidden", 403);
  }

  const dealer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, status: true },
  });
  if (!dealer || dealer.role !== "DEALER" || dealer.status !== "APPROVED") {
    return apiError("Dealer account is not approved", 403);
  }

  return { userId: session.userId };
}

export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const token = cookies().get("ourauto_token")?.value;
  if (!token) {
    return apiError("Unauthorized", 401);
  }
  const session = await verifyToken(token);
  if (!session || session.role !== "ADMIN") {
    return apiError("Forbidden", 403);
  }
  return { userId: session.userId };
}
