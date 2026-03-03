"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PlatformConfig = {
  hotDealMilestone: number;
  referralReward: number;
};

type PromotionPackage = {
  id: string;
  name: string;
  type: "HOT_DEAL" | "FUTURE_AD";
  credits: number;
  price: number;
  isActive: boolean;
};

export default function AdminSettingsPage(): JSX.Element {
  const [config, setConfig] = useState<PlatformConfig>({ hotDealMilestone: 10, referralReward: 5 });
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [form, setForm] = useState({ name: "", type: "HOT_DEAL", credits: "1", price: "0" });

  const load = async (): Promise<void> => {
    const [configResponse, packagesResponse] = await Promise.all([fetch("/api/admin/config"), fetch("/api/admin/packages")]);
    if (configResponse.ok) {
      const data = (await configResponse.json()) as { config: PlatformConfig };
      setConfig(data.config);
    }
    if (packagesResponse.ok) {
      const data = (await packagesResponse.json()) as { packages: PromotionPackage[] };
      setPackages(data.packages);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Promotion Settings</h1>
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <Input
          placeholder="Hot Deal Milestone"
          value={String(config.hotDealMilestone)}
          onChange={(event) => setConfig((prev) => ({ ...prev, hotDealMilestone: Number(event.target.value || "0") }))}
        />
        <Input
          placeholder="Referral Reward (Future Ad Credits)"
          value={String(config.referralReward)}
          onChange={(event) => setConfig((prev) => ({ ...prev, referralReward: Number(event.target.value || "0") }))}
        />
        <Button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/config", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(config),
            });
            await load();
          }}
        >
          Save Platform Config
        </Button>
      </div>

      <div className="mt-8 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-5">
        <Input placeholder="Package Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="HOT_DEAL">HOT_DEAL</option>
          <option value="FUTURE_AD">FUTURE_AD</option>
        </Select>
        <Input placeholder="Credits" value={form.credits} onChange={(event) => setForm({ ...form, credits: event.target.value })} />
        <Input placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        <Button
          onClick={async () => {
            await fetch("/api/admin/packages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.name,
                type: form.type,
                credits: Number(form.credits),
                price: Number(form.price),
              }),
            });
            setForm({ name: "", type: "HOT_DEAL", credits: "1", price: "0" });
            await load();
          }}
        >
          Create Package
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {packages.map((promotionPackage) => (
          <div key={promotionPackage.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="min-w-[220px] font-medium">{promotionPackage.name} • {promotionPackage.type}</div>
            <Input
              className="max-w-[120px]"
              defaultValue={String(promotionPackage.credits)}
              onBlur={async (event) => {
                await fetch("/api/admin/packages", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: promotionPackage.id, credits: Number(event.target.value) }),
                });
                await load();
              }}
            />
            <Input
              className="max-w-[140px]"
              defaultValue={String(promotionPackage.price)}
              onBlur={async (event) => {
                await fetch("/api/admin/packages", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: promotionPackage.id, price: Number(event.target.value) }),
                });
                await load();
              }}
            />
            <Button
              variant="secondary"
              onClick={async () => {
                await fetch("/api/admin/packages", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: promotionPackage.id, isActive: !promotionPackage.isActive }),
                });
                await load();
              }}
            >
              {promotionPackage.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
