"use client";

import { useEffect, useState } from "react";

type Listing = {
  id: string;
  isLive: boolean;
};

type OverviewStats = {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  unreadMessages: number;
};

const quickActions = ["Add Car", "View Listings", "Open Messages", "Edit Profile"];

export default function Overview() {
  const [dealerId, setDealerId] = useState("");
  const [hotDealCredits, setHotDealCredits] = useState(0);
  const [futureAdCredits, setFutureAdCredits] = useState(0);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalListings: 0,
    activeListings: 0,
    totalLeads: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadOverview = async () => {
      let nextDealerId = "";
      let nextHotDealCredits = 0;
      let nextFutureAdCredits = 0;
      let nextTotalLeads = 0;
      let nextUnreadMessages = 0;
      let nextTotalListings = 0;
      let nextActiveListings = 0;

      try {
        const [walletResponse, statsResponse] = await Promise.all([
          fetch("/api/dealer/wallet", { signal: controller.signal, cache: "no-store" }),
          fetch("/api/stats", { signal: controller.signal, cache: "no-store" }),
        ]);

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          const wallet = walletData?.data?.wallet;
          nextDealerId = wallet?.id || "";
          nextHotDealCredits = Number(wallet?.hotDealCredits) || 0;
          nextFutureAdCredits = Number(wallet?.futureAdCredits) || 0;
          nextTotalLeads = Number(wallet?.referralCounter) || 0;
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          nextUnreadMessages = Number(statsData?.data?.unreadMessages) || 0;
        }

        if (nextDealerId) {
          const listingsResponse = await fetch(
            `/api/listings?dealerId=${encodeURIComponent(nextDealerId)}`,
            { signal: controller.signal, cache: "no-store" }
          );

          if (listingsResponse.ok) {
            const listingsData = await listingsResponse.json();
            const listings = Array.isArray(listingsData?.data?.listings)
              ? (listingsData.data.listings as Listing[])
              : [];
            nextTotalListings = listings.length;
            nextActiveListings = listings.filter((item) => item.isLive).length;
          }
        }
      } catch {
        nextDealerId = "";
      }

      setDealerId(nextDealerId);
      setHotDealCredits(nextHotDealCredits);
      setFutureAdCredits(nextFutureAdCredits);
      setOverviewStats({
        totalListings: nextTotalListings,
        activeListings: nextActiveListings,
        totalLeads: nextTotalLeads,
        unreadMessages: nextUnreadMessages,
      });
    };

    loadOverview();

    return () => controller.abort();
  }, []);

  const stats = [
    { label: "Total Listings", value: String(overviewStats.totalListings) },
    { label: "Active Listings", value: String(overviewStats.activeListings) },
    { label: "Total Leads", value: String(overviewStats.totalLeads) },
    { label: "Unread Messages", value: String(overviewStats.unreadMessages) },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stats.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {item.value}
            </p>
          </article>
        ))}
      </div>

      <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Promotion Credits</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Hot Deal Credits: {hotDealCredits}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Future Ads Credits: {futureAdCredits}</p>
        {!dealerId ? (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Wallet could not be loaded.
          </p>
        ) : null}
      </article>

      <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {quickActions.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {action}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}