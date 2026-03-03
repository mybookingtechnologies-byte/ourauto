"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Subscription = {
  id: string;
  userId: string;
  planName: string;
  amount: string;
  isActive: boolean;
};

export default function AdminSubscriptionsPage(): JSX.Element {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [form, setForm] = useState({ userId: "", planName: "", amount: "", startsAt: "", expiresAt: "" });

  const load = async (): Promise<void> => {
    const response = await fetch("/api/admin/subscriptions");
    if (!response.ok) return;
    const data = (await response.json()) as { subscriptions: Subscription[] };
    setSubscriptions(data.subscriptions);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Subscription Management</h1>
      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-5">
        <Input placeholder="Dealer User ID" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} />
        <Input placeholder="Plan" value={form.planName} onChange={(event) => setForm({ ...form, planName: event.target.value })} />
        <Input placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        <Input placeholder="Starts (YYYY-MM-DD)" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
        <Input placeholder="Expires (YYYY-MM-DD)" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
        <Button
          onClick={async () => {
            await fetch("/api/admin/subscriptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...form, amount: Number(form.amount) }),
            });
            await load();
          }}
        >
          Create Plan
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div>{subscription.planName} • ₹{subscription.amount}</div>
            <Button
              variant="secondary"
              onClick={async () => {
                await fetch("/api/admin/subscriptions", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: subscription.id, isActive: !subscription.isActive }),
                });
                await load();
              }}
            >
              {subscription.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
