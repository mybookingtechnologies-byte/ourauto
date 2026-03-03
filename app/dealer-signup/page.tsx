"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type DealerSignupForm = {
  dealerName: string;
  ownerName: string;
  mobile: string;
  email: string;
  password: string;
  gst: string;
  city: string;
  state: string;
  address: string;
};

const initialForm: DealerSignupForm = {
  dealerName: "",
  ownerName: "",
  mobile: "",
  email: "",
  password: "",
  gst: "",
  city: "",
  state: "",
  address: "",
};

export default function Page(): JSX.Element {
  const { showToast } = useToast();
  const [form, setForm] = useState<DealerSignupForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DealerSignupForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof DealerSignupForm, string>> = {};
    if (!form.dealerName.trim()) nextErrors.dealerName = "Dealer name is required";
    if (!form.ownerName.trim()) nextErrors.ownerName = "Owner name is required";
    if (!/^[0-9]{10}$/.test(form.mobile.trim())) nextErrors.mobile = "Enter a valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = "Enter a valid email address";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (!form.city.trim()) nextErrors.city = "City is required";
    if (!form.state.trim()) nextErrors.state = "State is required";
    if (!form.address.trim()) nextErrors.address = "Address is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const updateField = (field: keyof DealerSignupForm, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="bg-bgPrimary px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <h1 className="text-2xl font-bold">Dealer Signup</h1>
          <p className="mt-1 text-sm text-zinc-500">Create your dealer account to access OurAuto marketplace.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Field label="Dealer Name" error={errors.dealerName}>
              <Input value={form.dealerName} onChange={(event) => updateField("dealerName", event.target.value)} placeholder="Dealer Name" />
            </Field>
            <Field label="Owner Name" error={errors.ownerName}>
              <Input value={form.ownerName} onChange={(event) => updateField("ownerName", event.target.value)} placeholder="Owner Name" />
            </Field>
            <Field label="Mobile" error={errors.mobile}>
              <Input value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} placeholder="10-digit mobile" />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" />
            </Field>
            <Field label="Password" error={errors.password}>
              <Input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Password" />
            </Field>
            <Field label="GST (optional)" error={errors.gst}>
              <Input value={form.gst} onChange={(event) => updateField("gst", event.target.value)} placeholder="GST Number" />
            </Field>
            <Field label="City" error={errors.city}>
              <Input value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City" />
            </Field>
            <Field label="State" error={errors.state}>
              <Input value={form.state} onChange={(event) => updateField("state", event.target.value)} placeholder="State" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" error={errors.address}>
                <Textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Business address" rows={3} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Document Upload</label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
              <p className="mt-1 text-xs text-zinc-500">UI placeholder only. File upload backend is not connected.</p>
            </div>
          </div>

          {errorMessage ? <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{errorMessage}</p> : null}
          {successMessage ? <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{successMessage}</p> : null}

          <Button
            className="mt-5 w-full"
            disabled={loading}
            onClick={async () => {
              setSuccessMessage(null);
              setErrorMessage(null);
              if (!validate()) return;

              setLoading(true);
              try {
                const response = await fetch("/api/auth/signup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    dealerName: form.dealerName,
                    businessName: form.ownerName,
                    mobile: form.mobile,
                    email: form.email,
                    password: form.password,
                  }),
                });

                if (!response.ok) {
                  const data = (await response.json().catch(() => null)) as { error?: string } | null;
                  setErrorMessage(data?.error || "Unable to submit signup form right now.");
                  showToast(data?.error || "Signup failed", "error");
                  return;
                }

                setSuccessMessage("Signup submitted successfully. Our team will verify your account.");
                showToast("Signup submitted successfully", "success");
                setForm(initialForm);
                setErrors({});
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button>

          <p className="mt-3 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-textColor hover:underline">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
