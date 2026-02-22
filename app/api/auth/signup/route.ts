import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/monitoring/logger";
import { verifyRecaptchaToken } from "@/lib/security/verifyRecaptcha";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  recaptchaToken: z.string().min(1),
}).strict();

export async function POST(request: NextRequest) {
  try {
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
    const captchaValid = await verifyRecaptchaToken(token);
    if (!captchaValid) {
      void logEvent("WARN", "AUTH_FAILURE", "Signup blocked by reCAPTCHA validation", {
        ip,
        email: parsed.data.email,
      });
      return NextResponse.json(
        { success: false, error: "reCAPTCHA verification failed" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      void logEvent("WARN", "AUTH_FAILURE", "Signup failed during auth provider registration", {
        ip,
        email: parsed.data.email,
      });
      return NextResponse.json({ error: error?.message ?? "Signup failed" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { error: profileError } = await admin.from("dealers").upsert({
      id: data.user.id,
      name: parsed.data.email.split("@")[0],
      city: "Unknown City",
      state: "Unknown State",
      is_verified: false,
      kyc_status: "pending",
      badge: "Basic",
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await admin.from("dealer_credits").upsert({ dealer_id: data.user.id });
    await admin.from("referral_wallets").upsert({ dealer_id: data.user.id, balance: 0 });

    return NextResponse.json({ message: "Signup successful" }, { status: 201 });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in signup API", {
      route: "/api/auth/signup",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}