type CsrfResult = {
  valid: boolean;
  reason?: string;
};

import crypto from "node:crypto";

const ALLOWED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_COOKIE_NAME = "ourauto_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

function parseCookies(cookieHeader: string | null) {
  const map = new Map<string, string>();
  if (!cookieHeader) {
    return map;
  }

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) {
      continue;
    }

    map.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }

  return map;
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeOrigin(value: string | null) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function getCsrfCookieName() {
  return CSRF_COOKIE_NAME;
}

export function getCsrfHeaderName() {
  return CSRF_HEADER_NAME;
}

export function verifyCsrf(request: Request): CsrfResult {
  if (!ALLOWED_METHODS.has(request.method.toUpperCase())) {
    return { valid: true };
  }

  const origin = normalizeOrigin(request.headers.get("origin"));
  const requestOrigin = normalizeOrigin(request.url);

  if (!origin) {
    return { valid: false, reason: "Missing Origin header" };
  }

  if (origin !== requestOrigin) {
    return { valid: false, reason: "Origin mismatch" };
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies.get(CSRF_COOKIE_NAME) || "";
  const headerToken = request.headers.get(CSRF_HEADER_NAME) || "";

  if (!cookieToken || !headerToken) {
    return { valid: false, reason: "Missing CSRF token" };
  }

  if (!timingSafeEqual(cookieToken, headerToken)) {
    return { valid: false, reason: "Invalid CSRF token" };
  }

  return { valid: true };
}
