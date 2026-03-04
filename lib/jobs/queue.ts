import crypto from "node:crypto";
import { Queue } from "bullmq";
import { logError, logInfo } from "@/lib/observability";
import { initJobStatus, setJobStatus } from "@/lib/jobs/status";

export type ListingMediaAnalysisJob = {
  filePaths: string[];
  dealerId: string;
  uploadedAt: string;
};

export type JobName = "listing-media-analysis";

type JobPayloadMap = {
  "listing-media-analysis": ListingMediaAnalysisJob;
};

let appQueue: Queue | null = null;

function getJobOwnerId<TName extends JobName>(name: TName, payload: JobPayloadMap[TName]) {
  if (name === "listing-media-analysis") {
    return (payload as ListingMediaAnalysisJob).dealerId;
  }

  return "";
}

function getQueue() {
  if (appQueue) {
    return appQueue;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  try {
    appQueue = new Queue("ourauto-jobs", {
      connection: {
        url: redisUrl,
      },
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: {
          age: 3600,
          count: 500,
        },
        removeOnFail: {
          age: 24 * 3600,
          count: 1000,
        },
        backoff: {
          type: "exponential",
          delay: 1500,
        },
      },
    });
  } catch (error) {
    logError("queue_init_error", error);
    return null;
  }

  return appQueue;
}

export async function enqueueJob<TName extends JobName>(name: TName, payload: JobPayloadMap[TName]) {
  const queue = getQueue();
  const ownerId = getJobOwnerId(name, payload);
  const jobId = crypto.randomUUID();

  if (!queue) {
    const fallbackJobId = `local-${jobId}`;
    if (ownerId) {
      await initJobStatus(fallbackJobId, ownerId);
      await setJobStatus(fallbackJobId, "failed", { message: "Queue unavailable" });
    }
    logInfo("queue_fallback_job_enqueued", {
      requestId: fallbackJobId,
      jobName: name,
      jobId: fallbackJobId,
    });
    return fallbackJobId;
  }

  if (ownerId) {
    await initJobStatus(jobId, ownerId);
  }
  await queue.add(name, payload, { jobId });
  logInfo("queue_job_enqueued", {
    requestId: jobId,
    jobName: name,
    jobId,
  });

  return jobId;
}

export function hasRedisQueue() {
  return Boolean(getQueue());
}
