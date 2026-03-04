"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AuthCard from "@/components/AuthCard";
import { useNotification } from "@/components/Notification";
import { withCsrfHeaders } from "@/lib/csrf-client";

type ValidationErrors = {
  name?: string;
  dealerName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

export default function SignupPage() {
  const { showSuccess, showError } = useNotification();
  const [name, setName] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const validateForm = () => {
    const nextErrors: ValidationErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Full Name is required";
    }

    if (!dealerName.trim()) {
      nextErrors.dealerName = "Dealer Name is required";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Please enter a valid email";
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone.trim())) {
      nextErrors.phone = "Phone must be exactly 10 digits";
      showError("Phone number must be 10 digits");
    }

    if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Confirm Password must match Password";
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(withCsrfHeaders().entries()),
        },
        body: JSON.stringify({
          name,
          dealerName,
          email,
          phone,
          password,
          referralCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const error = data?.error || "Signup failed";
        if (response.status === 409) {
          showError("Email already registered");
          return;
        }

        if (response.status === 400 && error === "Phone must be exactly 10 digits") {
          showError("Phone number must be 10 digits");
          return;
        }

        showError(error);
        return;
      }

      showSuccess("Account created successfully");
    } catch {
      showError("Signup failed");
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-zinc-950/40" aria-hidden="true" />
      <AuthCard title="Dealer Signup">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {validationErrors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Dealer / Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={dealerName}
              onChange={(event) => setDealerName(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {validationErrors.dealerName && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.dealerName}
              </p>
            )}
          </div>

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
            {validationErrors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="numeric"
              maxLength={10}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {validationErrors.phone && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.phone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {validationErrors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="referralCode"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Referral Code (optional)
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create Account
          </button>
        </form>

        <div className="mt-5 text-sm text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-[var(--primary-yellow)]"
          >
            Login
          </Link>
        </div>
      </AuthCard>
    </main>
  );
}