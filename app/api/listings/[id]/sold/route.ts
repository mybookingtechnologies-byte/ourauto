import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { logEvent } from "@/lib/monitoring/logger";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthenticatedUser();
    if (auth.errorResponse || !auth.user) {
      return auth.errorResponse as NextResponse;
    }

    const { id } = await context.params;

    const { data: listing } = await auth.supabase
      .from("listings")
      .select("id")
      .eq("id", id)
      .eq("dealer_id", auth.user.id)
      .maybeSingle();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const { error } = await auth.supabase
      .from("listings")
      .update({ status: "sold", sold_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Listing marked as sold and removed from feed." });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in mark-sold API", {
      route: "/api/listings/[id]/sold",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}