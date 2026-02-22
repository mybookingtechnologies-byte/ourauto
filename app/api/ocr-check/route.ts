import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/monitoring/logger";
import { hashBinary } from "@/lib/security/filters";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser();
    if (auth.errorResponse || !auth.user) {
      return auth.errorResponse as NextResponse;
    }

    const form = await request.formData();
    const image = form.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const imageHash = hashBinary(Buffer.from(bytes));
    const env = getServerEnv();
    const ocrResponse = await fetch(env.OCR_EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytes,
      cache: "no-store",
    });

    if (!ocrResponse.ok) {
      void logEvent("ERROR", "OCR_FAILURE", "OCR service returned non-success response", {
        userId: auth.user.id,
        status: ocrResponse.status,
      });
      return NextResponse.json({ error: "OCR service unavailable." }, { status: 502 });
    }

    const data = (await ocrResponse.json()) as {
      registrationNumber: string | null;
      confidence?: number;
    };

    if (!data.registrationNumber) {
      void logEvent("ERROR", "OCR_FAILURE", "OCR could not detect registration number", {
        userId: auth.user.id,
        confidence: data.confidence ?? null,
      });
      return NextResponse.json({ error: "Could not detect registration number." }, { status: 422 });
    }

    if (typeof data.confidence === "number" && data.confidence < 0.6) {
      void logEvent("ERROR", "OCR_FAILURE", "OCR confidence too low", {
        userId: auth.user.id,
        confidence: data.confidence,
      });
      return NextResponse.json({ error: "OCR confidence too low." }, { status: 422 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: duplicateHash } = await supabase
      .from("listing_media_hashes")
      .select("id")
      .eq("hash", imageHash)
      .maybeSingle();

    if (duplicateHash) {
      return NextResponse.json({ error: "Duplicate image detected." }, { status: 409 });
    }

    const { data: duplicate } = await supabase
      .from("listings")
      .select("id")
      .eq("registration_number", data.registrationNumber)
      .maybeSingle();

    if (duplicate) {
      void logEvent("SECURITY", "DUPLICATE_ATTEMPT", "Duplicate registration detected during OCR check", {
        userId: auth.user.id,
        regNoTail: data.registrationNumber.slice(-4),
      });
      return NextResponse.json(
        { error: "Duplicate registration found. Listing blocked." },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "OCR passed. No duplicate registration found.", imageHash });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in OCR check API", {
      route: "/api/ocr-check",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}