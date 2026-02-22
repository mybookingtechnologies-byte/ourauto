"use client";


import { useState, useEffect, FormEvent } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  // Wait until recaptcha becomes available
  useEffect(() => {
    // ...existing code...
  }, [executeRecaptcha]);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    console.log("Signup form submitted");
    if (!executeRecaptcha || isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log("About to execute reCAPTCHA and send signup request");
      const token = await executeRecaptcha("signup");
      if (!token) {
        setError("Verification failed. Please try again.");
        setIsSubmitting(false);
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
      if (!response.ok) {
        setError(payload.error || payload.message || "Signup failed.");
      } else {
        setError(null);
        alert(payload.message ?? "Account created.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Request failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-shell max-w-lg space-y-4 py-10">
      <h1 className="text-2xl font-bold">Dealer Signup</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label htmlFor="signup-email" className="block text-sm font-medium">Email</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-black/10 p-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-required="true"
        />
        <label htmlFor="signup-password" className="block text-sm font-medium">Password</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-xl border border-black/10 p-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-required="true"
        />
        {error && (
          <div className="text-red-600 text-sm" role="alert" aria-live="polite">{error}</div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>
      </form>
    </main>
  );
}