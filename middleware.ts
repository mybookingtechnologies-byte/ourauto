import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const dealerRoutes = ["/dealer"];
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("ourauto_token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (dealerRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "DEALER") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dealer/:path*", "/admin/:path*"],
};
