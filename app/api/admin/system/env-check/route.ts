import { requireAdminApi } from "@/lib/adminAuth";
import { getEnvPresence } from "@/lib/env";
import { fail, ok } from "@/lib/api";
import { logError, logInfo } from "@/lib/observability";
import { isRateLimited } from "@/lib/rateLimit";

const REQUIRED_ENV_KEYS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "NEXT_PUBLIC_APP_URL",
] as const;

export async function GET(request: Request) {
  try {
    if (await isRateLimited(request, "admin-env-check", 10, 60_000)) {
      return fail("Too many admin requests", 429);
    }

    const admin = await requireAdminApi(request);
    if (admin.response) {
      return admin.response;
    }

    const status = {
      DATABASE_URL: getEnvPresence("DATABASE_URL"),
      JWT_SECRET: getEnvPresence("JWT_SECRET"),
      RESEND_API_KEY: getEnvPresence("RESEND_API_KEY"),
      EMAIL_HOST: getEnvPresence("EMAIL_HOST"),
      EMAIL_PORT: getEnvPresence("EMAIL_PORT"),
      EMAIL_USER: getEnvPresence("EMAIL_USER"),
      EMAIL_PASS: getEnvPresence("EMAIL_PASS"),
      NEXT_PUBLIC_APP_URL: getEnvPresence("NEXT_PUBLIC_APP_URL"),
    };

    const missingKeys = REQUIRED_ENV_KEYS.filter((key) => status[key] === "missing");
    if (missingKeys.length > 0) {
      logInfo("missing_required_env", { missingKeys });
    }

    return ok(status, 200);
  } catch (error) {
    logError("admin_env_check_error", error);
    return ok({
      DATABASE_URL: "missing",
      JWT_SECRET: "missing",
      RESEND_API_KEY: "missing",
      EMAIL_HOST: "missing",
      EMAIL_PORT: "missing",
      EMAIL_USER: "missing",
      EMAIL_PASS: "missing",
      NEXT_PUBLIC_APP_URL: "missing",
    }, 200);
  }
}
