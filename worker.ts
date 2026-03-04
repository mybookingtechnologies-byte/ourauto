import { Worker } from "bullmq";
import sharp from "sharp";
import { cloudinary } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { queueConnection, queueName } from "@/lib/queue";
import { redis } from "@/lib/redis";

type CompressImageJob = {
  carId: string;
};

type SendNotificationJob = {
  userId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

const currentRegion = process.env.VERCEL_REGION || process.env.APP_REGION || "unknown";
const primaryRegion = process.env.PRIMARY_REGION || "bom1";
const workerMode = process.env.WORKER_MODE || "primary";
const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || "5");

async function uploadCompressedImage(buffer: Buffer, carId: string, index: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ourauto/cars/${carId}`,
        resource_type: "image",
        public_id: `compressed-${index}-${Date.now()}`,
        format: "jpg",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
}

async function processCompressImage(data: CompressImageJob): Promise<void> {
  const car = await prisma.car.findUnique({
    where: { id: data.carId },
    include: { media: { orderBy: { order: "asc" } } },
  });

  if (!car || car.media.length === 0) {
    return;
  }

  for (let index = 0; index < car.media.length; index += 1) {
    const media = car.media[index];
    try {
      const response = await fetch(media.url);
      if (!response.ok) {
        continue;
      }

      const inputBuffer = Buffer.from(await response.arrayBuffer());
      const compressed = await sharp(inputBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const url = await uploadCompressedImage(compressed, data.carId, index);
      await prisma.carMedia.update({
        where: { id: media.id },
        data: { url },
      });
    } catch {
      // Keep worker robust and continue with remaining media.
    }
  }
}

async function processNotification(data: SendNotificationJob): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
    },
  });

  await redis?.publish(
    `dealer:${data.userId}`,
    JSON.stringify({
      type: "NEW_NOTIFICATION",
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
    }),
  );
}

if (!queueConnection) {
  logger.warn("BullMQ worker not started: missing REDIS_URL/BULLMQ_REDIS_URL");
} else if (workerMode === "primary" && currentRegion !== primaryRegion) {
  logger.warn("Worker disabled in non-primary region", { currentRegion, primaryRegion, workerMode });
} else {
  const worker = new Worker(
    queueName,
    async (job) => {
      if (job.name === "compress-image") {
        await processCompressImage(job.data as CompressImageJob);
      }

      if (job.name === "send-notification") {
        await processNotification(job.data as SendNotificationJob);
      }
    },
    {
      connection: queueConnection,
      concurrency: Number.isFinite(workerConcurrency) ? Math.max(1, workerConcurrency) : 5,
    },
  );

  worker.on("failed", (job, error) => {
    logger.error("Queue job failed", {
      id: job?.id,
      name: job?.name,
      error: error.message,
      region: currentRegion,
    });
  });

  worker.on("completed", (job) => {
    logger.info("Queue job completed", { id: job.id, name: job.name, region: currentRegion });
  });
}
