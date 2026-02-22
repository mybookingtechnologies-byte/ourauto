import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeHotDealCredits } from "@/lib/business/credits";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { logEvent } from "@/lib/monitoring/logger";
import { hasSuspiciousKeyword } from "@/lib/security/filters";
import { consumeDbRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getListings } from "@/lib/data/listings";
import { verifyRecaptchaToken } from "@/lib/security/verifyRecaptcha";

const schema = z.object({
  recaptchaToken: z.string().min(1),
  regNo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,15}$/),
  year: z.number().int().nullable(),
  make: z.string().min(1),
  model: z.string().min(1),
  transmission: z.enum(["Manual", "Automatic"]),
  insurance: z.string().min(1),
  price: z.number().int().nullable(),
  km: z.number().int().nullable(),
  seoTitle: z.string().min(1),
  fuelType: z.enum(["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]),
  ownerType: z.enum(["1st", "2nd", "3rd+"]),
  mediaUrls: z.array(z.string().url()).default([]),
  imageHashes: z.array(z.string()).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const listings = await getListings({
      minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
      minKm: params.get("minKm") ? Number(params.get("minKm")) : undefined,
      maxKm: params.get("maxKm") ? Number(params.get("maxKm")) : undefined,
      fuelType: (params.get("fuelType") as never) ?? undefined,
      transmission: (params.get("transmission") as never) ?? undefined,
      ownerType: (params.get("ownerType") as never) ?? undefined,
      sort: (params.get("sort") as never) ?? "latest",
      city: params.get("city") ?? undefined,
      state: params.get("state") ?? undefined,
    });

    return NextResponse.json({ listings });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in listings GET API", {
      route: "/api/listings",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

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

    const payload = parsed.data;
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    const dbLimit = await consumeDbRateLimit(auth.user.id, "listing_create", 10, 60 * 60);
    if (!dbLimit.allowed) {
      void logEvent("WARN", "RATE_LIMIT", "Listing create rate limit exceeded", {
        userId: auth.user.id,
        ip,
      });
      return NextResponse.json({ error: "Listing rate limit exceeded (10/hour)." }, { status: 429 });
    }

    const recaptcha = await verifyRecaptchaToken(token);
    if (!recaptcha) {
      return NextResponse.json(
        { success: false, error: "reCAPTCHA verification failed" },
        { status: 401 }
      );
    }

    if (hasSuspiciousKeyword(`${payload.seoTitle} ${payload.make} ${payload.model}`)) {
      return NextResponse.json({ error: "Suspicious listing content detected." }, { status: 400 });
    }

    const { data: dealer } = await auth.supabase
      .from("dealers")
      .select("id,is_verified")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!dealer) {
      return NextResponse.json({ error: "Dealer profile not found." }, { status: 403 });
    }

    if (!dealer.is_verified) {
      return NextResponse.json({ error: "KYC verification required before listing creation." }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();

    if (payload.imageHashes?.length) {
      const { data: hashes } = await supabase
        .from("listing_media_hashes")
        .select("hash")
        .in("hash", payload.imageHashes);
      if ((hashes ?? []).length > 0) {
        return NextResponse.json({ error: "Duplicate image detected." }, { status: 409 });
      }
    }

    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const credits = computeHotDealCredits(count ?? 0);
    const shouldHotDeal = credits.credits > 0 && (count ?? 0) % 10 === 0;

    const { data: inserted, error } = await auth.supabase
      .from("listings")
      .insert({
        dealer_id: auth.user.id,
        title: payload.seoTitle,
        description: `${payload.make} ${payload.model}`,
        make: payload.make,
        model: payload.model,
        year: payload.year,
        city: "Unknown City",
        state: "Unknown State",
        price: payload.price,
        km: payload.km,
        fuel_type: payload.fuelType,
        transmission: payload.transmission,
        owner_type: payload.ownerType,
        insurance_type: payload.insurance,
        registration_number: payload.regNo,
        media_urls: payload.mediaUrls,
        is_hot_deal: shouldHotDeal,
        hot_deal_expires_at: shouldHotDeal
          ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          : null,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        void logEvent("SECURITY", "DUPLICATE_ATTEMPT", "Duplicate registration number attempt", {
          userId: auth.user.id,
          regNoTail: payload.regNo.slice(-4),
        });
        return NextResponse.json(
          { error: "Duplicate registration number. Listing blocked." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (payload.imageHashes?.length && inserted?.id) {
      const mediaRows = payload.imageHashes.map((hash) => ({ listing_id: inserted.id, hash }));
      const { error: hashError } = await auth.supabase.from("listing_media_hashes").insert(mediaRows);

      if (hashError) {
        await auth.supabase.from("listings").delete().eq("id", inserted.id);
        if (hashError.code === "23505") {
          return NextResponse.json({ error: "Duplicate image detected." }, { status: 409 });
        }
        return NextResponse.json({ error: hashError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Listing published." }, { status: 201 });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in listings API", {
      route: "/api/listings",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}