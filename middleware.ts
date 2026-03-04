import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { generateRequestId } from "@/lib/requestId";

const dealerProtectedRoutes = ["/dealer/marketplace", "/dealer/settings", "/dealer/listings", "/dealer/compare", "/dealer/add-car", "/dealer/chat", "/dealer/cars"];
const adminRoutes = ["/admin"];

async function hashIp(value: string): Promise<string> {
  const input = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

function withSecurityHeaders(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=()");
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") || generateRequestId();
  const pathname = request.nextUrl.pathname;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = request.ip ?? forwardedFor ?? "127.0.0.1";
  const hashedIp = await hashIp(ip);
  const rateKey = `rate:${hashedIp}`;

  const { success } = await rateLimit.limit(rateKey);
  if (!success) {
    return withSecurityHeaders(new NextResponse("Too Many Requests", { status: 429 }), requestId);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const token = request.cookies.get("ourauto_token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (dealerProtectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)), requestId);
    }
    if (session.role !== "DEALER") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)), requestId);
    }
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)), requestId);
    }
    if (session.role !== "ADMIN") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)), requestId);
    }
  }

  return withSecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    requestId,
  );
}

export const config = {
  matcher: ["/dealer/:path*", "/admin/:path*"],
};
