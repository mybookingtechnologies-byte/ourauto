"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6 sm:py-12">
      <Card className="w-full max-w-md">
        <h1 className="mb-4 text-2xl font-bold">Login</h1>
        <div className="space-y-3">
          <Input placeholder="Email or Mobile" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <div className="-mt-1 text-right">
            <Link href="/login" className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Forgot Password?
            </Link>
          </div>
          {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
          <Button
            className="w-full"
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                const response = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ identifier, password }),
                });
                if (!response.ok) {
                  const data = (await response.json().catch(() => null)) as { error?: string } | null;
                  setError(data?.error || "Login failed. Please check your credentials.");
                  showToast(data?.error || "Login failed", "error");
                  return;
                }
                const data = (await response.json()) as { role: "DEALER" | "ADMIN" };
                showToast("Login successful", "success");
                router.push(data.role === "ADMIN" ? "/admin" : "/dealer");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
          <div className="pt-1 text-center">
            <Link href="/dealer-signup" className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Dealer Signup
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
