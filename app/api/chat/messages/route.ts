import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validators";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const roomId = new URL(request.url).searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      OR: [{ dealerOneId: auth.userId }, { dealerTwoId: auth.userId }],
    },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message payload" }, { status: 400 });
  }

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: parsed.data.roomId,
      OR: [{ dealerOneId: auth.userId }, { dealerTwoId: auth.userId }],
    },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId: parsed.data.roomId,
      senderId: auth.userId,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ message });
}
