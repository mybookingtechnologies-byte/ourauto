"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-bgPrimary px-6 py-12">
      <Card className="w-full max-w-md">
        <h1 className="mb-4 text-2xl font-bold">Login</h1>
        <div className="space-y-3">
          <Input placeholder="Email or Mobile" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button
            className="w-full"
            onClick={async () => {
              setLoading(true);
              const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
              });
              setLoading(false);
              if (!response.ok) return;
              const data = (await response.json()) as { role: "DEALER" | "ADMIN" };
              router.push(data.role === "ADMIN" ? "/admin" : "/dealer");
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
