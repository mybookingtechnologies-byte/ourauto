import crypto from "node:crypto";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkDuplicate, normalizePlateNumber } from "@/lib/duplicateDetector";
import { verifyCsrf } from "@/lib/csrf";
import { logError } from "@/lib/observability";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    if (await isRateLimited(request, "listing-duplicate-check", 10, 60_000)) {
      return fail("Too many duplicate checks. Try again shortly.", 429);
    }

    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const price = Number(formData.get("price") || 0);
    const plateNumberRaw = String(formData.get("plateNumber") || "").trim();
    const firstImage = formData.get("firstImage");

    if (!title || !city || Number.isNaN(price) || price <= 0) {
      return fail("title, price and city are required", 400);
    }

    let imageHash = "";
    if (firstImage instanceof File) {
      const bytes = await firstImage.arrayBuffer();
      imageHash = crypto.createHash("md5").update(Buffer.from(bytes)).digest("hex");
    }

    const duplicate = await checkDuplicate(prisma, {
      dealerId: user.id,
      title,
      price,
      city,
      plateNumber: plateNumberRaw ? normalizePlateNumber(plateNumberRaw) : null,
      imageHash,
    });

    return ok(
      {
        duplicateScore: duplicate.score,
        duplicateType: duplicate.type,
        duplicateListing: duplicate.listing,
        imageHash,
      },
      200
    );
  } catch (error) {
    logError("duplicate_check_error", error);
    return fail("Unable to check duplicate listing", 500);
  }
}
