import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { logError } from "@/lib/observability";

type DeleteRequestPayload = {
  reason?: string;
};

export async function POST(request: Request) {
  try {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    let body: DeleteRequestPayload;

    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }

    const reason = body.reason?.trim();

    if (!reason) {
      return fail("Reason is required", 400);
    }

    if (reason.length > 500) {
      return fail("Reason is too long", 400);
    }

    const existingPendingRequest = await prisma.deleteRequest.findFirst({
      where: {
        dealerId: user.id,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingPendingRequest) {
      return ok({ message: "A deletion request is already pending." }, 200);
    }

    await prisma.deleteRequest.create({
      data: {
        dealerId: user.id,
        reason,
        status: "PENDING",
      },
    });

    return ok({ message: "Your deletion request has been submitted. Admin will review." }, 201);
  } catch (error) {
    logError("dealer_delete_request_error", error);
    return fail("Unable to submit deletion request", 500);
  }
}
