"use client";

import { useEffect, useState } from "react";

type Listing = {
  id: string;
  title: string;
  price: number;
  city: string;
  boostType: "NORMAL" | "HOT_DEAL" | "FUTURE_AD";
  isLive: boolean;
};

function getBoostBadge(boostType: Listing["boostType"]) {
  if (boostType === "HOT_DEAL") {
    return "🔥 HOT DEAL";
  }

  if (boostType === "FUTURE_AD") {
    return "🚀 FUTURE AD";
  }

  return "";
}

export default function Listings() {
  const [dealerId, setDealerId] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("dealerId") || ""
  );
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dealerId.trim()) {
      return;
    }

    window.localStorage.setItem("dealerId", dealerId.trim());
    const controller = new AbortController();

    fetch(`/api/listings?dealerId=${encodeURIComponent(dealerId.trim())}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unable to load listings");
        }

        const data = await res.json();
        setListings(Array.isArray(data?.data?.listings) ? data.data.listings : []);
        setError("");
      })
      .catch(() => {
        setListings([]);
        setError("Unable to load dealer listings");
      });

    return () => controller.abort();
  }, [dealerId]);

  return (
    <section className="space-y-6">
      <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200" htmlFor="dealer-listings-id">
          Dealer ID
        </label>
        <input
          id="dealer-listings-id"
          value={dealerId}
          onChange={(event) => {
            const value = event.target.value;
            setDealerId(value);
            if (!value.trim()) {
              setListings([]);
              setError("");
            }
          }}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder="Enter dealer user id"
        />
      </article>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((item) => (
          <article
            key={item.id}
            className="relative rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            {getBoostBadge(item.boostType) ? (
              <span className="absolute right-3 top-3 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                {getBoostBadge(item.boostType)}
              </span>
            ) : null}
            <div className="h-36 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-4 space-y-2">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(item.price)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.city}</p>
              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {item.isLive ? "Live" : "Draft"}
              </span>
            </div>
          </article>
        ))}
      </div>

      {dealerId.trim() && listings.length === 0 && !error ? (
        <div className="py-16 text-center text-zinc-400">
          <p className="text-sm">No listings yet for this dealer.</p>
        </div>
      ) : null}
    </section>
  );
}