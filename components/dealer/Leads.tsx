"use client";

import { useEffect, useState } from "react";

type LeadItem = {
  id: string;
  car: string;
  buyerName: string;
  phone: string;
  message: string;
  date: string;
  status: string;
};

export default function Leads() {
  const [leads, setLeads] = useState<LeadItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/dealer/leads", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setLeads(Array.isArray(data?.data?.leads) ? data.data.leads : []);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6">
      <article className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-3 py-3 font-medium">Car</th>
              <th className="px-3 py-3 font-medium">Buyer Name</th>
              <th className="px-3 py-3 font-medium">Phone</th>
              <th className="px-3 py-3 font-medium">Message</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-zinc-100 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
              >
                <td className="px-3 py-3">{lead.car}</td>
                <td className="px-3 py-3">{lead.buyerName}</td>
                <td className="px-3 py-3">{lead.phone}</td>
                <td className="px-3 py-3">{lead.message}</td>
                <td className="px-3 py-3">{new Date(lead.date).toLocaleDateString()}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {leads.length === 0 ? (
        <div className="py-16 text-center text-zinc-400">
          <p className="text-sm">No leads yet.</p>
        </div>
      ) : null}
    </section>
  );
}