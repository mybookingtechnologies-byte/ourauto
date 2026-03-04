"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Dealer = {
  id: string;
  dealerName: string | null;
  businessName: string | null;
  email: string;
  mobile: string;
  city: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export function DealerManagement(): JSX.Element {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (): Promise<void> => {
    setLoading(true);
    const response = await fetch("/api/admin/dealers", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { dealers: Dealer[] };
      setDealers(data.dealers);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (dealerId: string, status: "APPROVED" | "REJECTED"): Promise<void> => {
    await fetch(`/api/admin/dealers/${dealerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dealer Management</h2>
        <p className="text-sm text-zinc-400">{loading ? "Refreshing..." : `${dealers.length} dealers`}</p>
      </div>
      <div className="space-y-3">
        {dealers.slice(0, 10).map((dealer) => (
          <div key={dealer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
            <div>
              <p className="font-medium">{dealer.businessName || dealer.dealerName || "Dealer"}</p>
              <p className="text-zinc-400">{dealer.city || "-"} • {dealer.email}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={async () => { await updateStatus(dealer.id, "APPROVED"); }}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={async () => { await updateStatus(dealer.id, "REJECTED"); }}>
                Suspend
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
