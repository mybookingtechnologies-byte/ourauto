import type { JobsOptions } from "bullmq";
import { Queue } from "bullmq";
import { logger } from "@/lib/logger";

type QueueConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
};

export type QueueJobName = "compress-image" | "send-notification";

function parseRedisUrl(url: string): QueueConnection {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || (parsed.protocol === "rediss:" ? 6380 : 6379)),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
  };
}

function resolveRedisUrl(): string | null {
  return process.env.REDIS_URL || process.env.BULLMQ_REDIS_URL || null;
}

const redisUrl = resolveRedisUrl();
export const isQueueEnabled = Boolean(redisUrl);
export const queueName = "ourauto-jobs";
export const queueConnection = redisUrl ? parseRedisUrl(redisUrl) : null;
export const appRegion = process.env.VERCEL_REGION || process.env.APP_REGION || "unknown";

export const jobQueue = queueConnection
  ? new Queue(queueName, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 500,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    })
  : null;

export async function enqueueJob<T extends Record<string, unknown>>(
  name: QueueJobName,
  data: T,
  options?: JobsOptions,
): Promise<void> {
  if (!jobQueue) {
    return;
  }

  try {
    await jobQueue.add(name, data, options);
  } catch (error) {
    logger.error("Queue enqueue failed", {
      name,
      error: error instanceof Error ? error.message : "unknown",
      region: appRegion,
    });
    // Non-blocking by design.
  }
}

export async function enqueueCompressImageJob(carId: string): Promise<void> {
  await enqueueJob("compress-image", { carId });
}

export async function enqueueNotificationJob(
  userId: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await enqueueJob("send-notification", {
    userId,
    title,
    message,
    metadata,
  });
}

export async function checkQueueHealth(): Promise<boolean> {
  if (!jobQueue) {
    return false;
  }

  try {
    await jobQueue.getJobCounts("wait", "active", "completed", "failed", "delayed", "paused");
    return true;
  } catch {
    return false;
  }
}
