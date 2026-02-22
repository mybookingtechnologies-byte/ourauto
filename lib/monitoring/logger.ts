import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY";
export type LogType =
  | "RATE_LIMIT"
  | "OCR_FAILURE"
  | "AUTH_FAILURE"
  | "DUPLICATE_ATTEMPT"
  | "SYSTEM_ERROR";

type SafeMeta = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "recaptchatoken",
  "authorization",
  "secret",
  "image",
  "rawimage",
  "bytes",
]);

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 2) {
    return "[TRUNCATED]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(input)) {
      const safeKey = key.toLowerCase();
      output[key] = SENSITIVE_KEYS.has(safeKey)
        ? "[REDACTED]"
        : sanitizeValue(child, depth + 1);
    }
    return output;
  }

  return String(value);
}

function sanitizeMeta(meta?: SafeMeta): SafeMeta {
  if (!meta) return {};
  return sanitizeValue(meta, 0) as SafeMeta;
}

async function writeToDatabase(payload: {
  level: LogLevel;
  type: LogType;
  message: string;
  meta: SafeMeta;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("system_logs").insert({
    level: payload.level,
    type: payload.type,
    message: payload.message,
    meta: payload.meta,
  });
}

async function dispatchToSinks(payload: {
  level: LogLevel;
  type: LogType;
  message: string;
  meta: SafeMeta;
}) {
  await writeToDatabase(payload);
}

export function logEvent(level: LogLevel, type: LogType, message: string, meta?: SafeMeta) {
  queueMicrotask(() => {
    void dispatchToSinks({
      level,
      type,
      message,
      meta: sanitizeMeta(meta),
    }).catch(() => {
      return;
    });
  });
}
