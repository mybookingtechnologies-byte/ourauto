"use client";

import { useEffect, useState } from "react";

type EnvStatus = "present" | "missing";

type EnvCheckResponse = {
  DATABASE_URL?: EnvStatus;
  JWT_SECRET?: EnvStatus;
  RESEND_API_KEY?: EnvStatus;
  EMAIL_HOST?: EnvStatus;
  EMAIL_PORT?: EnvStatus;
  EMAIL_USER?: EnvStatus;
  EMAIL_PASS?: EnvStatus;
  NEXT_PUBLIC_APP_URL?: EnvStatus;
};

const ENV_KEYS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "NEXT_PUBLIC_APP_URL",
] as const;

export default function SystemStatusCard() {
  const [status, setStatus] = useState<EnvCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus(isRefresh: boolean) {
      try {
        const response = await fetch("/api/admin/system/env-check", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = (await response.json()) as { data?: EnvCheckResponse };
        if (!cancelled) {
          setStatus(data.data || null);
          setError(null);
        }
      } catch {
        if (cancelled) {
          return;
        }

        if (isRefresh) {
          return;
        }

        setError("Unable to load system diagnostics");
      } finally {
        if (!cancelled && !isRefresh) {
          setLoading(false);
        }
      }
    }

    loadStatus(false);

    const interval = setInterval(() => {
      loadStatus(true);
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">System Environment Status</h2>

      {loading ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Checking system configuration...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {ENV_KEYS.map((key) => {
            const value = status?.[key] === "present" ? "present" : "missing";
            const isPresent = value === "present";

            return (
              <li key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{key}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    isPresent
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {isPresent ? "✅ Present" : "❌ Missing"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
