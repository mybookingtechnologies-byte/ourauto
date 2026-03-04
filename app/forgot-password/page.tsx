"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { withCsrfHeaders } from "@/lib/csrf-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(withCsrfHeaders().entries()),
        },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error || "Unable to send reset link");
        return;
      }

      setSuccess("Check your email for reset instructions.");
    } catch {
      setError("Unable to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-zinc-950/40" aria-hidden="true" />
      <AuthCard title="Reset Password">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-5 text-sm">
          <Link
            href="/login"
            className="text-zinc-400 transition hover:text-[var(--primary-yellow)]"
          >
            Back to Login
          </Link>
        </div>
      </AuthCard>
    </main>
  );
}