import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/monitoring";
import { trace } from "@opentelemetry/api";
import { generateRequestId } from "@/lib/requestId";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiSuccess<T extends object>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function validateCsrf(request: NextRequest): string | null {
  if (!MUTATING_METHODS.has(request.method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return "Missing host header";
  }

  const expected = request.nextUrl.origin;
  const isValidOrigin = (value: string): boolean => {
    try {
      return new URL(value).origin === expected;
    } catch {
      return false;
    }
  };

  if (origin && isValidOrigin(origin)) {
    return null;
  }

  if (referer && isValidOrigin(referer)) {
    return null;
  }

  return "CSRF validation failed";
}

export type ApiHandler = (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse>;

export function withApiHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const requestId = request.headers.get("x-request-id") || generateRequestId();
    const activeSpan = trace.getActiveSpan();
    try {
      const response = await handler(request, context);
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const nextError = error as { digest?: string; message?: string };
      if (nextError.digest?.includes("DYNAMIC_SERVER_USAGE") || nextError.message?.includes("Dynamic server usage")) {
        throw error;
      }

      captureException(error, {
        path: request.nextUrl.pathname,
        method: request.method,
        requestId,
      });
      logger.error("Unhandled API error", {
        path: request.nextUrl.pathname,
        method: request.method,
        requestId,
        traceId: activeSpan?.spanContext().traceId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      const response = apiError("Internal server error", 500);
      response.headers.set("x-request-id", requestId);
      return response;
    }
  };
}
