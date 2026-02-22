"use client";

import { useState, useEffect } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha();

  // Wait until recaptcha becomes available
  useEffect(() => {
    if (executeRecaptcha) {
      setIsReady(true);
    }
  }, [executeRecaptcha]);

  async function signup() {
    if (!executeRecaptcha || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const token = await executeRecaptcha("signup");

      if (!token) {
        alert("Verification failed. Please try again.");
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          recaptchaToken: token,
        }),
      });

      const payload = await response.json();
      alert(payload.message ?? payload.error ?? "Done");
    } catch {
      alert("Request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell max-w-lg space-y-4 py-10">
      <h1 className="text-2xl font-bold">Dealer Signup</h1>

      <input
        className="w-full rounded-xl border border-black/10 p-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full rounded-xl border border-black/10 p-3"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="button"
        className="cta"
        onClick={signup}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create Account"}
      </button>
    </main>
  );
}