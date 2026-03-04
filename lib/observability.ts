import * as Sentry from "@sentry/nextjs";

type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "cookie",
  "resetLink",
  "resetToken",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [key, current] of Object.entries(source)) {
      if (SENSITIVE_KEYS.has(key)) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = sanitize(current);
      }
    }

    return cleaned;
  }

  return value;
}

function sanitizeContext(context: LogContext) {
  return sanitize(context) as LogContext;
}

function writeStructuredLog(level: "info" | "error", payload: Record<string, unknown>) {
  const line = `${JSON.stringify(payload)}\n`;
  const runtimeProcess = (globalThis as { process?: { stdout?: { write: (chunk: string) => void }; stderr?: { write: (chunk: string) => void } } }).process;

  if (level === "error") {
    if (runtimeProcess?.stderr?.write) {
      runtimeProcess.stderr.write(line);
      return;
    }

    (globalThis as { console?: { error?: (...args: unknown[]) => void } }).console?.error?.(line);
    return;
  }

  if (runtimeProcess?.stdout?.write) {
    runtimeProcess.stdout.write(line);
    return;
  }

  (globalThis as { console?: { info?: (...args: unknown[]) => void } }).console?.info?.(line);
}

function withRequestId(context: LogContext) {
  const requestId = typeof context.requestId === "string" && context.requestId.trim()
    ? context.requestId
    : crypto.randomUUID();

  return {
    requestId,
    ...context,
  };
}

export function logInfo(event: string, context: LogContext = {}) {
  writeStructuredLog("info", {
    level: "info",
    event,
    ...sanitizeContext(withRequestId(context)),
    at: new Date().toISOString(),
  });
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  const normalizedError = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };

  Sentry.captureException(error, {
    tags: {
      event,
    },
    extra: sanitizeContext(withRequestId(context)),
  });

  writeStructuredLog("error", {
    level: "error",
    event,
    error: sanitize(normalizedError),
    ...sanitizeContext(withRequestId(context)),
    at: new Date().toISOString(),
  });
}
