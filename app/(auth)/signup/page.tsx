"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState({
    dealerName: "",
    businessName: "",
    mobile: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-bgPrimary px-6 py-12">
      <Card className="w-full max-w-md">
        <h1 className="mb-4 text-2xl font-bold">Dealer Signup</h1>
        <div className="space-y-3">
          <Input placeholder="Dealer Name" value={form.dealerName} onChange={(event) => setForm({ ...form, dealerName: event.target.value })} />
          <Input placeholder="Business Name" value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} />
          <Input placeholder="Mobile" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <Button
            className="w-full"
            onClick={async () => {
              setLoading(true);
              await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              });
              setLoading(false);
              router.push("/login");
            }}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Dealer Account"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
