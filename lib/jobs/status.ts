import Redis from "ioredis";
import { logError } from "@/lib/observability";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

type JobStatusRecord = {
  ownerId: string;
  status: JobStatus;
  result?: Record<string, unknown>;
  updatedAt: string;
};

const JOB_STATUS_PREFIX = "ourauto:job-status";
const JOB_STATUS_TTL_SECONDS = 24 * 60 * 60;

let redisClient: Redis | null = null;

function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    return redisClient;
  } catch (error) {
    logError("job_status_redis_init_error", error);
    return null;
  }
}

function getJobStatusKey(jobId: string) {
  return `${JOB_STATUS_PREFIX}:${jobId}`;
}

async function writeJobStatus(jobId: string, record: JobStatusRecord) {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    await redis.set(getJobStatusKey(jobId), JSON.stringify(record), "EX", JOB_STATUS_TTL_SECONDS);
  } catch (error) {
    logError("job_status_write_error", error, { jobId });
  }
}

export async function initJobStatus(jobId: string, ownerId: string) {
  await writeJobStatus(jobId, {
    ownerId,
    status: "pending",
    updatedAt: new Date().toISOString(),
  });
}

export async function setJobStatus(jobId: string, status: JobStatus, result?: Record<string, unknown>) {
  const existing = await getRawJobStatus(jobId);
  if (!existing) {
    return;
  }

  await writeJobStatus(jobId, {
    ownerId: existing.ownerId,
    status,
    result,
    updatedAt: new Date().toISOString(),
  });
}

async function getRawJobStatus(jobId: string): Promise<JobStatusRecord | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const raw = await redis.get(getJobStatusKey(jobId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as JobStatusRecord;
    if (!parsed?.ownerId || !parsed?.status) {
      return null;
    }

    return parsed;
  } catch (error) {
    logError("job_status_read_error", error, { jobId });
    return null;
  }
}

export async function getJobStatusForOwner(jobId: string, ownerId: string) {
  const record = await getRawJobStatus(jobId);
  if (!record || record.ownerId !== ownerId) {
    return null;
  }

  return {
    status: record.status,
    result: record.result,
  };
}
