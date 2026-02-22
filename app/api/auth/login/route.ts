import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/monitoring/logger";
import { verifyRecaptcha } from "@/lib/security/filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  recaptchaToken: z.string().min(1),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const captchaValid = await verifyRecaptcha(parsed.data.recaptchaToken, ip);
    if (!captchaValid) {
      void logEvent("WARN", "AUTH_FAILURE", "Login blocked by reCAPTCHA validation", {
        ip,
        email: parsed.data.email,
      });
      return NextResponse.json({ error: "reCAPTCHA verification failed." }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      void logEvent("WARN", "AUTH_FAILURE", "Login rejected due to invalid credentials", {
        ip,
        email: parsed.data.email,
      });
      return NextResponse.json({ error: error?.message ?? "Invalid credentials" }, { status: 401 });
    }

    const { data: dealer } = await supabase
      .from("dealers")
      .select("id,is_verified")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!dealer?.is_verified) {
      await supabase.auth.signOut();
      void logEvent("WARN", "AUTH_FAILURE", "Login blocked due to dealer verification pending", {
        ip,
        userId: data.user.id,
      });
      return NextResponse.json({ error: "Dealer verification pending." }, { status: 403 });
    }

    return NextResponse.json({ message: "Login successful", userId: data.user.id });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in login API", {
      route: "/api/auth/login",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}