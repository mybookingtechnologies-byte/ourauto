import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseListingMessage } from "@/lib/business/smart-parser";
import { logEvent } from "@/lib/monitoring/logger";

const schema = z.object({
  message: z.string().min(5),
  city: z.string().optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    return NextResponse.json({
      parsed: parseListingMessage(parsed.data.message, parsed.data.city),
    });
  } catch (error) {
    void logEvent("ERROR", "SYSTEM_ERROR", "Unhandled error in parser API", {
      route: "/api/parser",
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}