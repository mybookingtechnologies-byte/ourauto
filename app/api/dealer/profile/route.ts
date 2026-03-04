import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { logError } from "@/lib/observability";
import { dealerProfileSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        dealerName: true,
        phone: true,
        city: true,
        businessAddress: true,
        aboutDealer: true,
      },
    });

    if (!profile) {
      return fail("Dealer not found", 404);
    }

    return ok({ profile }, 200);
  } catch (error) {
    logError("dealer_profile_fetch_error", error);
    return fail("Unable to load dealer profile", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const parsed = dealerProfileSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail("Invalid profile payload", 400);
    }

    const { dealerName, phone, city, businessAddress, aboutDealer } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        dealerName,
        phone,
        city: city || null,
        businessAddress: businessAddress || null,
        aboutDealer: aboutDealer || null,
      },
      select: {
        id: true,
        dealerName: true,
        phone: true,
        city: true,
        businessAddress: true,
        aboutDealer: true,
      },
    });

    return ok({ message: "Profile updated", profile: updated }, 200);
  } catch (error) {
    logError("dealer_profile_update_error", error);
    return fail("Unable to update dealer profile", 500);
  }
}
