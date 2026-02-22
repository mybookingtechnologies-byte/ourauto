import { NextResponse } from "next/server";

const protectedPagePrefixes = ["/dashboard", "/listings/new"];
const protectedApiPrefixes = [
  "/api/listings/",
  "/api/ocr-check",
  "/api/wishlist",
  "/api/chat/initiate",
  "/api/notifications",
  "/api/referral/wallet",
];

function hasAuthCookie(cookieHeader: string) {
  return (
    cookieHeader.includes("sb-access-token=") ||
    cookieHeader.includes("sb-refresh-token=") ||
    (cookieHeader.includes("sb-") && cookieHeader.includes("-auth-token="))
  );
}

export function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https: data:; media-src 'self' https:; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/; frame-ancestors 'none';"
  );

  const isProtectedPage = protectedPagePrefixes.some((prefix) => pathname.startsWith(prefix));
  const isProtectedApi =
    (pathname === "/api/listings" && request.method === "POST") ||
    protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtectedPage && !isProtectedApi) {
    return response;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  if (hasAuthCookie(cookieHeader)) {
    return response;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const loginUrl = appUrl ? new URL("/auth/login", appUrl) : new URL("/auth/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};