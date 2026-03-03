import { logger } from "@/lib/logger";

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  logger.error("Captured exception", {
    error: error instanceof Error ? error.message : "Unknown error",
    ...(context ? { context } : {}),
  });

  // Sentry-ready placeholder:
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
}
