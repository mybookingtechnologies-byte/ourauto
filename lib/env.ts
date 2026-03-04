import { z } from "zod";

const requiredEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.string().min(1).default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
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
