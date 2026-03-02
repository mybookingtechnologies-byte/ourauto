import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { chatRoomCreateSchema } from "@/lib/validators";

function normalizeDealerPair(first: string, second: string): [string, string] {
  return first < second ? [first, second] : [second, first];
}

export async function GET(): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const rooms = await prisma.chatRoom.findMany({
    where: {
      OR: [{ dealerOneId: auth.userId }, { dealerTwoId: auth.userId }],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rooms });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const parsed = chatRoomCreateSchema.safeParse(body);
  if (!parsed.success || parsed.data.targetDealerId === auth.userId) {
    return NextResponse.json({ error: "Invalid target dealer" }, { status: 400 });
  }

  const [dealerOneId, dealerTwoId] = normalizeDealerPair(auth.userId, parsed.data.targetDealerId);

  const room = await prisma.chatRoom.upsert({
    where: {
      dealerOneId_dealerTwoId: {
        dealerOneId,
        dealerTwoId,
      },
    },
    create: {
      dealerOneId,
      dealerTwoId,
    },
    update: {},
  });

  return NextResponse.json({ room });
}
