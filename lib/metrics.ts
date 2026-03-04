import { logger } from "@/lib/logger";

export function measureExecution(label: string, start: number, meta?: Record<string, unknown>): void {
  const durationMs = Date.now() - start;
  logger.info(`${label} completed`, {
    durationMs,
    ...(meta || {}),
  });
}