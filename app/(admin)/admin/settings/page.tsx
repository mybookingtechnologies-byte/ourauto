"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage(): JSX.Element {
  const [maxImages, setMaxImages] = useState("10");
  const [autoExpireDays, setAutoExpireDays] = useState("30");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Global Settings</h1>
      <div className="space-y-3 rounded-2xl bg-bgSecondary p-6 shadow-lg">
        <Input placeholder="Max images" value={maxImages} onChange={(event) => setMaxImages(event.target.value)} />
        <Input placeholder="Auto expire days" value={autoExpireDays} onChange={(event) => setAutoExpireDays(event.target.value)} />
        <Button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ maxImages: Number(maxImages), autoExpireDays: Number(autoExpireDays) }),
            });
          }}
        >
          Save Settings
        </Button>
      </div>
    </main>
  );
}
