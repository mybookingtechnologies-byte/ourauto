"use client";

import { useEffect, useState } from "react";

type MarketplaceListing = {
  id: string;
  title: string;
  price: number;
  city: string;
  dealerName: string;
  boostType: "NORMAL" | "HOT_DEAL" | "FUTURE_AD";
};

function getBadge(boostType: MarketplaceListing["boostType"]) {
  if (boostType === "HOT_DEAL") {
    return "🔥 HOT DEAL";
  }

  if (boostType === "FUTURE_AD") {
    return "🚀 FUTURE AD";
  }

  return "";
}

export default function Home() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/listings", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unable to load listings");
        }

        const data = await res.json();
        setListings(Array.isArray(data?.data?.listings) ? data.data.listings : []);
        setError("");
      })
      .catch(() => {
        setError("Unable to load marketplace listings");
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-[calc(100vh-76px)]">
      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Marketplace</h1>
          <p className="text-sm text-zinc-400">Browse live listings from verified dealers.</p>
        </header>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <article
              key={item.id}
              className="relative rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              {getBadge(item.boostType) ? (
                <span className="absolute right-3 top-3 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  {getBadge(item.boostType)}
                </span>
              ) : null}

              <div className="h-36 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-4 space-y-1.5">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h2>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(item.price)}
                </p>
                <p className="text-sm text-zinc-400">{item.city}</p>
                <p className="text-xs text-zinc-400">Dealer: {item.dealerName}</p>
              </div>
            </article>
          ))}
        </section>

        {!error && listings.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <p className="text-sm">No live listings yet.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
