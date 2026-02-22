
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/monitoring/logger";
import { verifyRecaptchaToken } from "@/lib/security/verifyRecaptcha";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(64),
  city: z.string().min(1).max(64),
  state: z.string().min(1).max(64),
  phone: z.string().min(7).max(20),
  recaptchaToken: z.string().min(1),
}).strict();


export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { email, password, name, city, state, phone, recaptchaToken } = parsed.data;

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const captchaValid = await verifyRecaptchaToken(recaptchaToken);
    if (!captchaValid) {
      void logEvent("WARN", "AUTH_FAILURE", "Signup blocked by reCAPTCHA validation", {
        ip,
        email,
      });
      return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Check if dealer already exists
    const { data: existingDealer, error: dealerCheckError } = await admin
      .from("dealers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (dealerCheckError) {
      void logEvent("ERROR", "SYSTEM_ERROR", "Dealer existence check failed", {
        email,
        reason: dealerCheckError.message,
      });
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
    if (existingDealer) {
      return NextResponse.json({ error: "Dealer already exists." }, { status: 409 });
    }

    // Create Supabase Auth user
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      void logEvent("WARN", "AUTH_FAILURE", "Signup failed during auth provider registration", {
        ip,
        email,
        reason: authError?.message,
      });
      return NextResponse.json({ error: authError?.message ?? "Signup failed" }, { status: 400 });
    }

    // Insert dealer row
    const dealerPayload = {
      id: authUser.user.id,
      email,
      name,
      city,
      state,
      phone,
      is_verified: false,
      kyc_status: "pending",
      badge: "Basic",
    };
    const { error: dealerInsertError } = await admin
      .from("dealers")
      .insert([dealerPayload]);

    if (dealerInsertError) {
      void logEvent("ERROR", "SYSTEM_ERROR", "Dealer insert failed", {
        email,
        reason: dealerInsertError.message,
      });
      return NextResponse.json({ error: "Dealer creation failed." }, { status: 500 });
    }

    // Optionally initialize credits/wallets
    await admin.from("dealer_credits").upsert({ dealer_id: authUser.user.id });
    await admin.from("referral_wallets").upsert({ dealer_id: authUser.user.id, balance: 0 });

    return NextResponse.json({ message: "Signup successful" }, { status: 201 });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in signup API", {
      route: "/api/auth/signup",
      reason: error instanceof Error ? (error as Error).message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}