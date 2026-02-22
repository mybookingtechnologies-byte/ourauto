"use client";

import Link from "next/link";
import { useState } from "react";
import { RecaptchaWidget } from "@/components/security/recaptcha-widget";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  async function login() {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, recaptchaToken: token }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      alert(payload.message ?? payload.error ?? "Done");
    } catch {
      alert("Request failed. Please try again.");
    }
  }

  return (
    <main className="app-shell max-w-lg space-y-4 py-10">
      <h1 className="text-2xl font-bold">Dealer Login</h1>
      <input
        className="w-full rounded-xl border border-black/10 p-3"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        className="w-full rounded-xl border border-black/10 p-3"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <RecaptchaWidget onToken={setToken} />
      <button type="button" className="cta" onClick={login}>
        Login
      </button>
      <p className="pt-1 text-center text-xs text-neutral-500 opacity-90 dark:text-neutral-400">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="transition hover:text-yellow-400 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}