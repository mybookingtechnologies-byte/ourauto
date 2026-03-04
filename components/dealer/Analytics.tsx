"use client";

import { useEffect, useState } from "react";

type AnalyticsPayload = {
  totalListings: number;
  leadConversion: number;
  topListing: string;
  monthlyActivity: number;
};

export default function Analytics() {
  const [payload, setPayload] = useState<AnalyticsPayload>({
    totalListings: 0,
    leadConversion: 0,
    topListing: "-",
    monthlyActivity: 0,
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/dealer/analytics", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        setPayload({
          totalListings: Number(data?.data?.totalListings || 0),
          leadConversion: Number(data?.data?.leadConversion || 0),
          topListing: String(data?.data?.topListing || "-"),
          monthlyActivity: Number(data?.data?.monthlyActivity || 0),
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = [
    { label: "Total Listings", value: String(payload.totalListings) },
    { label: "Lead Conversion", value: `${payload.leadConversion}%` },
    { label: "Top Listing", value: payload.topListing },
    { label: "Monthly Activity", value: String(payload.monthlyActivity) },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metrics.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {item.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}