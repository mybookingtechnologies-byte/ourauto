import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { logEvent } from "@/lib/monitoring/logger";
import { consumeDbRateLimit } from "@/lib/security/rate-limit";
import { verifyRecaptchaToken } from "@/lib/security/verifyRecaptcha";

const schema = z.object({
  listingId: z.string().uuid(),
  message: z.string().min(2).max(500),
  recaptchaToken: z.string().min(1),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser();
    if (auth.errorResponse || !auth.user) {
      return auth.errorResponse as NextResponse;
    }

    const body = await request.json();
    const token = typeof body?.recaptchaToken === "string" ? body.recaptchaToken.trim() : "";
    if (!token) {
      return NextResponse.json({ success: false, error: "Token missing" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const dbLimit = await consumeDbRateLimit(auth.user.id, "chat_initiate", 20, 60 * 60);
    if (!dbLimit.allowed) {
      void logEvent("WARN", "RATE_LIMIT", "Chat initiation rate limit exceeded", {
        userId: auth.user.id,
        ip,
      });
      return NextResponse.json(
        { error: "Chat initiation rate limit exceeded (20/hour)." },
        { status: 429 }
      );
    }

    const recaptcha = await verifyRecaptchaToken(token);
    if (!recaptcha) {
      return NextResponse.json(
        { success: false, error: "reCAPTCHA verification failed" },
        { status: 401 }
      );
    }

    const { data: listing } = await auth.supabase
      .from("listings")
      .select("id")
      .eq("id", parsed.data.listingId)
      .eq("status", "active")
      .maybeSingle();

    if (!listing) {
      return NextResponse.json({ error: "Listing not available for chat." }, { status: 404 });
    }

    const { error } = await auth.supabase.from("chat_initiations").insert({
      listing_id: parsed.data.listingId,
      dealer_id: auth.user.id,
      message: parsed.data.message,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Chat initiated" }, { status: 201 });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in chat initiate API", {
      route: "/api/chat/initiate",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}