import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { logEvent } from "@/lib/monitoring/logger";

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();
    if (auth.errorResponse || !auth.user) {
      return auth.errorResponse as NextResponse;
    }

    const { data, error } = await auth.supabase
      .from("referral_wallets")
      .select("balance")
      .eq("dealer_id", auth.user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ balance: data?.balance ?? 0 });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in referral wallet API", {
      route: "/api/referral/wallet",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}