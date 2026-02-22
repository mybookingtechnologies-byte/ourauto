import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnvLocal() {
  const filePath = resolve(process.cwd(), ".env.local");
  try {
    const content = readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional in CI where env vars may come from the runtime.
  }
}

loadDotEnvLocal();

const requiredPublic = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
];

const requiredServer = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RECAPTCHA_SECRET_KEY",
  "OCR_EDGE_FUNCTION_URL",
  "SUSPICIOUS_KEYWORDS",
];

const allRequired = [...requiredPublic, ...requiredServer];

const invalidPublicKeys = requiredPublic.filter((key) => !key.startsWith("NEXT_PUBLIC_"));
const invalidServerKeys = requiredServer.filter((key) => key.startsWith("NEXT_PUBLIC_"));

if (invalidPublicKeys.length > 0 || invalidServerKeys.length > 0) {
  console.error("Invalid env key classification in scripts/validate-env.mjs:");
  invalidPublicKeys.forEach((key) => console.error(`- Public keys must start with NEXT_PUBLIC_: ${key}`));
  invalidServerKeys.forEach((key) => console.error(`- Server keys must not start with NEXT_PUBLIC_: ${key}`));
  process.exit(1);
}

const missing = allRequired.filter((key) => {
  const value = process.env[key];
  return typeof value !== "string" || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error("Missing required environment variables:");
  missing.forEach((key) => console.error(`- ${key}`));
  process.exit(1);
}

const suspiciousKeywordsRaw = process.env.SUSPICIOUS_KEYWORDS ?? "";
const suspiciousKeywords = suspiciousKeywordsRaw
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

if (suspiciousKeywordsRaw !== suspiciousKeywords.join(",") || suspiciousKeywords.length === 0) {
  console.error(
    "Invalid SUSPICIOUS_KEYWORDS. Use a non-empty comma-separated list (example: fraud,scam,duplicate,fake,illegal,stolen,blacklisted)."
  );
  process.exit(1);
}

console.log("Environment validation passed.");
