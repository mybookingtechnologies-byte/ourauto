import { createHash } from "node:crypto";
import { getServerEnv, getSuspiciousKeywords } from "@/lib/env";

export function hashBinary(input: Buffer) {
  return createHash("sha256").update(input).digest("hex");
}

export function hasSuspiciousKeyword(text: string) {
  const lower = text.toLowerCase();
  return getSuspiciousKeywords().some((word) => lower.includes(word));
}

export async function verifyRecaptcha(token: string, remoteip?: string) {
  const env = getServerEnv();
  const body = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: token,
  });

  if (remoteip) {
    body.set("remoteip", remoteip);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean; score?: number };
  return Boolean(result.success && (result.score ?? 1) >= 0.4);
}