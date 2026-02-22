"use client";

import { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();

  async function signup() {
    if (!executeRecaptcha) {
      alert("Verification not ready");
      return;
    }
    const token = await executeRecaptcha("signup");
    if (!token) {
      alert("Verification failed");
      return;
    }
    try {
      const response = await fetch("/api/auth/signup", {
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
      <h1 className="text-2xl font-bold">Dealer Signup</h1>
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
      {/* reCAPTCHA widget removed, token handled in submit */}
      <button type="button" className="cta" onClick={signup}>
        Create Account
      </button>
    </main>
  );
}