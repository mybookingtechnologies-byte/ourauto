"use client";

import { useEffect, useState } from "react";

type DealerItem = {
  dealerId: string;
  name: string;
  reputationScore: number;
  totalListings: number;
  duplicateListings: number;
  spamReports: number;
};

type DealerContact = {
  id: string;
  phone: string;
};

function getReputationBadgeClass(score: number) {
  if (score >= 90) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }

  if (score >= 70) {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  }

  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
}

export default function AdminDealersPage() {
  const [dealers, setDealers] = useState<DealerItem[]>([]);
  const [contactByDealerId, setContactByDealerId] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDealers = async () => {
      try {
        const [reputationResponse, contactsResponse] = await Promise.all([
          fetch("/api/admin/dealers/reputation", { cache: "no-store" }),
          fetch("/api/admin/dealers", { cache: "no-store" }),
        ]);

        const reputationData = await reputationResponse.json();
        if (!reputationResponse.ok) {
          if (!cancelled) {
            setError(reputationData.error || "Unable to load dealers");
          }
          return;
        }

        if (!cancelled) {
          setDealers(Array.isArray(reputationData?.data?.dealers) ? reputationData.data.dealers : []);
        }

        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          const contacts = Array.isArray(contactsData?.data?.dealers) ? (contactsData.data.dealers as DealerContact[]) : [];
          const contactMap = contacts.reduce<Record<string, string>>((accumulator, dealer) => {
            accumulator[dealer.id] = dealer.phone || "-";
            return accumulator;
          }, {});

          if (!cancelled) {
            setContactByDealerId(contactMap);
          }
        }

        if (!cancelled) {
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load dealers");
        }
      }
    };

    void loadDealers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6">
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <article className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-3 py-2 font-medium">Dealer</th>
              <th className="px-3 py-2 font-medium">Phone / Email</th>
              <th className="px-3 py-2 font-medium">Listings</th>
              <th className="px-3 py-2 font-medium">Duplicates</th>
              <th className="px-3 py-2 font-medium">Spam Reports</th>
              <th className="px-3 py-2 font-medium">Reputation Score</th>
            </tr>
          </thead>
          <tbody>
            {dealers.map((dealer) => (
              <tr key={dealer.dealerId} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.name}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                  <div className="space-y-1">
                    <div>{contactByDealerId[dealer.dealerId] || "-"}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">-</div>
                  </div>
                </td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.totalListings}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.duplicateListings}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.spamReports}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getReputationBadgeClass(dealer.reputationScore)}`}
                  >
                    {dealer.reputationScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {!error && dealers.length === 0 ? (
        <div className="py-16 text-center text-zinc-400">
          <p className="text-sm">No dealers found.</p>
        </div>
      ) : null}
    </section>
  );
}
