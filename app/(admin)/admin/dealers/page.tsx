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

  const updateStatus = async (dealerId: string, status: "APPROVED" | "REJECTED"): Promise<void> => {
    await fetch(`/api/admin/dealers/${dealerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const statusClass: Record<Dealer["status"], string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    APPROVED: "bg-green-500/20 text-green-400",
    REJECTED: "bg-red-500/20 text-red-400",
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Dealer Management</h1>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">Dealer Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Mobile</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dealers.map((dealer) => (
              <tr key={dealer.id} className="border-b border-zinc-200 last:border-none dark:border-zinc-800">
                <td className="px-4 py-3">{dealer.businessName || dealer.dealerName || "-"}</td>
                <td className="px-4 py-3">{dealer.email}</td>
                <td className="px-4 py-3">{dealer.mobile}</td>
                <td className="px-4 py-3">{dealer.city || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-2xl px-2 py-1 text-xs font-semibold ${statusClass[dealer.status]}`}>
                    {dealer.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={async () => { await updateStatus(dealer.id, "APPROVED"); }}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await updateStatus(dealer.id, "REJECTED"); }}>Reject</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
