import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { Worker } from "bullmq";
import Tesseract from "tesseract.js";
import { logError, logInfo } from "@/lib/observability";
import type { ListingMediaAnalysisJob } from "@/lib/jobs/queue";
import { setJobStatus } from "@/lib/jobs/status";

const NUMBER_PLATE_REGEX = /\b[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{3,4}\b/i;
const OCR_SCAN_LIMIT = 4;
const OCR_TIMEOUT_MS = 4500;

async function detectPlate(filePath: string) {
  try {
    const ocrPromise = Tesseract.recognize(filePath, "eng");
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error("OCR_TIMEOUT"));
      }, OCR_TIMEOUT_MS);
    });

    const result = await Promise.race([ocrPromise, timeoutPromise]);
    const text = result.data.text.toUpperCase().replace(/[^A-Z0-9\s-]/g, " ");
    return NUMBER_PLATE_REGEX.test(text);
  } catch {
    return false;
  }
}

async function analyzeListingMedia(jobId: string, payload: ListingMediaAnalysisJob) {
  const paths = payload.filePaths.slice(0, OCR_SCAN_LIMIT);
  const hashes: string[] = [];
  let detectedPlateIndex = -1;

  for (let index = 0; index < payload.filePaths.length; index += 1) {
    const bytes = await readFile(payload.filePaths[index]);
    hashes.push(crypto.createHash("md5").update(bytes).digest("hex"));
  }

  for (let index = 0; index < paths.length; index += 1) {
    const hasPlate = await detectPlate(paths[index]);
    if (hasPlate) {
      detectedPlateIndex = index;
      break;
    }
  }

  logInfo("listing_media_analysis_completed", {
    requestId: jobId,
    jobId,
    dealerId: payload.dealerId,
    detectedPlateIndex,
    hashCount: hashes.length,
  });

  return {
    hashCount: hashes.length,
    detectedPlateIndex,
    scannedImages: paths.length,
  };
}

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logInfo("job_worker_disabled", {
    reason: "REDIS_URL_MISSING",
  });
} else {
  const worker = new Worker(
    "ourauto-jobs",
    async (job) => {
      const jobId = String(job.id || crypto.randomUUID());
      await setJobStatus(jobId, "processing");

      try {
        if (job.name === "listing-media-analysis") {
          const result = await analyzeListingMedia(jobId, job.data as ListingMediaAnalysisJob);
          await setJobStatus(jobId, "completed", result);
          return;
        }

        await setJobStatus(jobId, "failed", { message: "Unsupported job type" });
      } catch (error) {
        await setJobStatus(jobId, "failed", { message: "Job processing failed" });
        throw error;
      }
    },
    {
      connection: {
        url: redisUrl,
      },
    }
  );

  worker.on("failed", (job, error) => {
    logError("job_worker_failed", error, {
      requestId: String(job?.id || crypto.randomUUID()),
      jobName: job?.name,
    });
  });

  worker.on("error", (error) => {
    logError("job_worker_error", error);
  });

  logInfo("job_worker_started", {
    queue: "ourauto-jobs",
  });
}
