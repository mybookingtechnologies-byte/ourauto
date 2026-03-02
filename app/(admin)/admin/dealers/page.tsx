"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Dealer = {
  id: string;
  dealerName: string | null;
  businessName: string | null;
  email: string;
  mobile: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
};

export default function AdminDealersPage(): JSX.Element {
  const [dealers, setDealers] = useState<Dealer[]>([]);

  const load = async (): Promise<void> => {
    const response = await fetch("/api/admin/dealers");
    if (!response.ok) return;
    const data = (await response.json()) as { dealers: Dealer[] };
    setDealers(data.dealers);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Dealer Management</h1>
      <div className="space-y-3">
        {dealers.map((dealer) => (
          <div key={dealer.id} className="rounded-2xl bg-bgSecondary p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{dealer.businessName || dealer.dealerName}</h2>
                <p className="text-sm text-zinc-500">{dealer.email} • {dealer.mobile} • {dealer.status}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={async () => { await fetch("/api/admin/dealers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: dealer.id, action: "APPROVED" }) }); await load(); }}>Approve</Button>
                <Button variant="secondary" onClick={async () => { await fetch("/api/admin/dealers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: dealer.id, action: "SUSPENDED" }) }); await load(); }}>Suspend</Button>
                <Button variant="outline" onClick={async () => { await fetch("/api/admin/dealers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: dealer.id, action: "DELETE" }) }); await load(); }}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
