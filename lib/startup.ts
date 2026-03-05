import { logError, logInfo } from "@/lib/observability";

const REQUIRED_ENV_KEYS = ["DATABASE_URL", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"] as const;
const OPTIONAL_ENV_KEYS = ["RESEND_API_KEY", "EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS", "REDIS_URL", "SENTRY_DSN"] as const;

let hasRunBootChecks = false;

export function runBootEnvChecks() {
  if (hasRunBootChecks) {
    return;
  }

  hasRunBootChecks = true;

  const missingRequired = REQUIRED_ENV_KEYS.filter((key) => !process.env[key] || process.env[key]?.trim() === "");
  const missingOptional = OPTIONAL_ENV_KEYS.filter((key) => !process.env[key] || process.env[key]?.trim() === "");

  if (missingOptional.length > 0) {
    logInfo("optional_env_missing", {
      missingKeys: missingOptional,
    });
  }

  if (missingRequired.length > 0) {
    const error = new Error(`Missing required env: ${missingRequired.join(", ")}`);
    logError("required_env_missing", error, {
      missingKeys: missingRequired,
    });

    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}
