import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

const throttles = new Map<string, { count: number; resetAt: number }>();

function throttle(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = throttles.get(key);

  if (!entry || entry.resetAt < now) {
    throttles.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  throttles.set(key, entry);
  return true;
}

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (request.nextUrl.pathname.startsWith("/api") && !throttle(`api:${ip}`, 200, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https: data:; media-src 'self' https:; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/; frame-ancestors 'none';"
  );

  const protectedPaths = ["/dashboard", "/listings/new"];
  const isProtectedPage = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  const isProtectedApi =
    (request.nextUrl.pathname === "/api/listings" && request.method === "POST") ||
    request.nextUrl.pathname.startsWith("/api/listings/") ||
    request.nextUrl.pathname.startsWith("/api/ocr-check") ||
    request.nextUrl.pathname.startsWith("/api/wishlist") ||
    request.nextUrl.pathname.startsWith("/api/chat/initiate") ||
    request.nextUrl.pathname.startsWith("/api/notifications") ||
    request.nextUrl.pathname.startsWith("/api/referral/wallet");

  const requiresAuth = isProtectedPage || isProtectedApi;

  if (!requiresAuth) {
    return response;
  }

  const env = getPublicEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (requiresAuth && !user) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};