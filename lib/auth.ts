import crypto from "node:crypto";
import type { User } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getEnv } from "@/lib/env";

const SESSION_COOKIE_NAME = "ourauto_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSessionSecret() {
  return getEnv("JWT_SECRET");
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function safeCompareSignatures(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

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

    map.set(rawKey, rawValue.join("="));
  }

  return map;
}

type SessionPayload = {
  userId: string;
  exp: number;
  ver: number;
  nonce: string;
};

export function createSessionToken(userId: string, version: number) {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + SESSION_TTL_MS,
    ver: version,
    nonce: crypto.randomUUID(),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function getSessionCookieHeader(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function getClearSessionCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  if (!safeCompareSignatures(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (
      !payload.userId
      || typeof payload.exp !== "number"
      || payload.exp <= Date.now()
      || typeof payload.ver !== "number"
      || payload.ver < 0
      || typeof payload.nonce !== "string"
      || payload.nonce.length < 8
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function getUserFromRequest(request: Request): Promise<Pick<User, "id" | "email" | "dealerName"> | null> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies.get(SESSION_COOKIE_NAME);
  const payload = verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      dealerName: true,
      sessionVersion: true,
    },
  });

  if (!user || user.sessionVersion !== payload.ver) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    dealerName: user.dealerName,
  };
}
