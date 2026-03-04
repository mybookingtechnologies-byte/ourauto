import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "ourauto_session";
const CSRF_COOKIE_NAME = "ourauto_csrf";

function createCsrfToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}

function resolveRequestId(request: NextRequest) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
}

function ensureCsrfCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (existing) {
    return;
  }

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: createCsrfToken(),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function needsAuthProtection(pathname: string) {
  return pathname.startsWith("/dealer") || pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const requestId = resolveRequestId(request);

  if (needsAuthProtection(pathname) && !sessionCookie) {
    if (pathname.startsWith("/api/")) {
      const unauthorizedResponse = NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      unauthorizedResponse.headers.set("x-request-id", requestId);
      applySecurityHeaders(unauthorizedResponse);
      ensureCsrfCookie(request, unauthorizedResponse);
      return unauthorizedResponse;
    }

    const loginUrl = new URL("/login", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set("x-request-id", requestId);
    applySecurityHeaders(redirectResponse);
    ensureCsrfCookie(request, redirectResponse);
    return redirectResponse;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-request-id", requestId);
  applySecurityHeaders(response);
  ensureCsrfCookie(request, response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
