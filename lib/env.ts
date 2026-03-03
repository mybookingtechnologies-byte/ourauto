import { z } from "zod";

const requiredEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const parsedEnv = requiredEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const firstMissing = parsedEnv.error.issues[0]?.path?.[0];
  if (typeof firstMissing === "string") {
    throw new Error(`Missing required env: ${firstMissing}`);
  }
  throw new Error("Missing required env: UNKNOWN");
}

export const env = parsedEnv.data;
