import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, withApiHandler } from "@/lib/api";
import { logger } from "@/lib/logger";
import { handleWebhook } from "@/lib/webhooks";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return apiError("Webhook secret not configured", 500);
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return apiError("Missing webhook signature", 400);
  }

  const rawBody = await request.text();
  const isValid = verifySignature(rawBody, signature, secret);
  if (!isValid) {
    logger.warn("Razorpay webhook signature verification failed");
    return apiError("Invalid webhook signature", 401);
  }

  const parsed = JSON.parse(rawBody) as { event?: string; payload?: Record<string, unknown> };
  logger.info("Razorpay webhook received", { event: parsed.event || "unknown" });
  await handleWebhook({
    type: parsed.event || "unknown",
    payload: parsed.payload,
  });

  return apiSuccess({ received: true });
});
