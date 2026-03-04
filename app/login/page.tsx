"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { useNotification } from "@/components/Notification";
import { withCsrfHeaders } from "@/lib/csrf-client";

export default function LoginPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(withCsrfHeaders().entries()),
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        showError("Invalid email or password");
        return;
      }

      showSuccess("Login successful");
      router.push("/dealer");
    } catch {
      showError("Invalid email or password");
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-zinc-950/40" aria-hidden="true" />
      <AuthCard title="Login">
        <form className="space-y-5" onSubmit={handleSubmit}>
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

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:text-zinc-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a3 3 0 104.2 4.2" />
                    <path d="M9.9 5.1A10.7 10.7 0 0112 5c5 0 9 4 10 7-0.3 0.9-0.8 1.8-1.5 2.6" />
                    <path d="M6.2 6.2C4.5 7.5 3.4 9.2 2 12c1 3 5 7 10 7 1 0 1.9-.1 2.8-.4" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] dark:bg-zinc-100 dark:text-zinc-900"
          >
            Login
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm">
          <Link
            href="/forgot-password"
            className="text-zinc-400 transition hover:text-[var(--primary-yellow)]"
          >
            Forgot Password
          </Link>
          <Link
            href="/signup"
            className="text-zinc-400 transition hover:text-[var(--primary-yellow)]"
          >
            Create Account (Signup)
          </Link>
        </div>
      </AuthCard>
    </main>
  );
}