import { NextResponse } from "next/server";

export function middleware(request: Request) {
  try {
    const requestUrl = typeof request?.url === "string" ? request.url : "";
    if (!requestUrl) {
      return NextResponse.next();
    }

    let pathname = "";
    try {
      pathname = new URL(requestUrl).pathname || "";
    } catch {
      return NextResponse.next();
    }

    if (!pathname) {
      return NextResponse.next();
    }

    const isProtectedPage = pathname === "/listings/new" || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    const isProtectedApi =
      pathname === "/api/ocr-check" ||
      pathname === "/api/wishlist" ||
      pathname === "/api/chat/initiate" ||
      pathname === "/api/notifications" ||
      pathname === "/api/referral/wallet";

    if (!isProtectedPage && !isProtectedApi) {
      return NextResponse.next();
    }

    const cookieHeader = request?.headers?.get?.("cookie") || "";
    const isAuthenticated =
      cookieHeader.includes("sb-access-token=") || cookieHeader.includes("sb-refresh-token=");

    if (isAuthenticated) {
      return NextResponse.next();
    }

    if (isProtectedApi) {
      return new NextResponse('{"error":"Unauthorized"}', { status: 401 });
    }

    const loginUrl = new URL("/auth/login", requestUrl);
    return NextResponse.redirect(loginUrl);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/listings/new",
    "/api/ocr-check",
    "/api/wishlist",
    "/api/chat/initiate",
    "/api/notifications",
    "/api/referral/wallet",
  ],
};