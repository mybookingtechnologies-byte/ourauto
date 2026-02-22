import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { logEvent } from "@/lib/monitoring/logger";

const schema = z.object({
  listingId: z.string().uuid(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser();
    if (auth.errorResponse || !auth.user) {
      return auth.errorResponse as NextResponse;
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { error } = await auth.supabase.from("wishlists").upsert({
      dealer_id: auth.user.id,
      listing_id: parsed.data.listingId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Saved to wishlist" });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in wishlist API", {
      route: "/api/wishlist",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}