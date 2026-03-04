"use client";

import { useEffect, useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";

type ListingItem = {
  id: string;
  title: string;
  price: number;
  createdAt: string;
  isLive: boolean;
  deletedByAdmin: boolean;
  dealer: {
    dealerName: string;
  };
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadListings = async () => {
    try {
      const response = await fetch("/api/admin/listings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to load listings");
        return;
      }

      setListings(Array.isArray(data?.data?.listings) ? data.data.listings : []);
      setError("");
    } catch {
      setError("Unable to load listings");
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const deleteListing = async (listingId: string) => {
    setBusyId(listingId);
    try {
      const response = await fetch("/api/admin/listings/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(withCsrfHeaders().entries()),
        },
        body: JSON.stringify({ listingId }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to delete listing");
        return;
      }

      await loadListings();
    } catch {
      setError("Unable to delete listing");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-6">
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <article className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-3 py-2 font-medium">Listing Title</th>
              <th className="px-3 py-2 font-medium">Dealer</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Created At</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{listing.title}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{listing.dealer.dealerName}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">₹{new Intl.NumberFormat("en-IN").format(listing.price)}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{new Date(listing.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{listing.deletedByAdmin ? "Deleted" : listing.isLive ? "Live" : "Inactive"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => deleteListing(listing.id)}
                    disabled={listing.deletedByAdmin || busyId === listing.id}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:text-[var(--primary-yellow)] disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    Delete Listing
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {!error && listings.length === 0 ? (
        <div className="py-16 text-center text-zinc-400">
          <p className="text-sm">No listings found.</p>
        </div>
      ) : null}
    </section>
  );
}
