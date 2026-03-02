"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DealerSettingsPage(): JSX.Element {
  const [dealerName, setDealerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const load = async (): Promise<void> => {
      const response = await fetch("/api/dealer/profile");
      if (!response.ok) return;
      const data = (await response.json()) as { user?: { dealerName?: string | null; businessName?: string | null; city?: string | null } };
      setDealerName(data.user?.dealerName || "");
      setBusinessName(data.user?.businessName || "");
      setCity(data.user?.city || "");
    };
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Dealer Settings</h1>
      <div className="space-y-3 rounded-2xl bg-bgSecondary p-6 shadow-lg">
        <Input placeholder="Dealer Name" value={dealerName} onChange={(event) => setDealerName(event.target.value)} />
        <Input placeholder="Business Name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
        <Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
        <Button
          onClick={async () => {
            await fetch("/api/dealer/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dealerName, businessName, city }),
            });
          }}
        >
          Update Profile
        </Button>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl bg-bgSecondary p-6 shadow-lg">
        <Input placeholder="Current Password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <Input placeholder="New Password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <Button
          onClick={async () => {
            await fetch("/api/dealer/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            setCurrentPassword("");
            setNewPassword("");
          }}
        >
          Change Password
        </Button>
      </div>
    </main>
  );
}
