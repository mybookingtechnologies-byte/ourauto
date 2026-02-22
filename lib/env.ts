import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RECAPTCHA_SECRET_KEY: z.string().min(1),
  OCR_EDGE_FUNCTION_URL: z.string().url(),
  SUSPICIOUS_KEYWORDS: z.string().min(1),
});

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid public environment variables: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function getSuspiciousKeywords() {
  const env = getServerEnv();
  return env.SUSPICIOUS_KEYWORDS.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}