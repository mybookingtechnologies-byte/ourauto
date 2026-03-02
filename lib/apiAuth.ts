import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function requireDealer(): Promise<{ userId: string } | NextResponse> {
  const token = cookies().get("ourauto_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await verifyToken(token);
  if (!session || session.role !== "DEALER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId: session.userId };
}

export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const token = cookies().get("ourauto_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await verifyToken(token);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId: session.userId };
}
