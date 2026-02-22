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
      .from("push_notifications")
      .select("id,title,body,sent_at,is_read")
      .eq("dealer_id", auth.user.id)
      .order("sent_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in notifications API", {
      route: "/api/notifications",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}