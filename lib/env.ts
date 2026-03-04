import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().min(1).default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
});

if (!parsedEnv.success) {
  const firstMissing = parsedEnv.error.issues[0]?.path?.[0];
  if (typeof firstMissing === "string") {
    throw new Error(`Missing required env: ${firstMissing}`);
  }
  throw new Error("Missing required env: UNKNOWN");
}

export const env = parsedEnv.data;
