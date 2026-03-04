import { fail, ok } from "@/lib/api";
import { getClearSessionCookieHeader, getUserFromRequest } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import prisma from "@/lib/prisma";
import { logError } from "@/lib/observability";

export async function POST(request: Request) {
  const csrf = verifyCsrf(request);
  if (!csrf.valid) {
    return fail(csrf.reason || "Invalid CSRF token", 403);
  }

  try {
    const user = await getUserFromRequest(request);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          sessionVersion: {
            increment: 1,
          },
        },
      });
    }
  } catch (error) {
    logError("logout_session_revoke_error", error);
  }

  const response = ok({ message: "Logged out" }, 200);
  response.headers.append("Set-Cookie", getClearSessionCookieHeader());
  return response;
}

function methodNotAllowed() {
  return new Response(
    JSON.stringify({ success: false, error: "Method not allowed" }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        Allow: "POST",
      },
    }
  );
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
