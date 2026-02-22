"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatInitiatePanel } from "@/components/marketplace/chat-initiate-panel";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { ListingCard } from "@/components/marketplace/listing-card";
import type { Listing, ListingFilters } from "@/types/domain";

interface Props {
  initialListings: Listing[];
  defaultCity: string;
  defaultState: string;
}

const WISHLIST_KEY = "ourauto_wishlist";
const RECENTLY_VIEWED_KEY = "ourauto_recently_viewed";

function readStoredArray(key: string) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function listToQuery(filters: ListingFilters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

export function MarketplaceClient({ initialListings, defaultCity, defaultState }: Props) {
  const [filters, setFilters] = useState<ListingFilters>({
    sort: "latest",
    city: defaultCity,
    state: defaultState,
  });
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [wishlist, setWishlist] = useState<string[]>(() => readStoredArray(WISHLIST_KEY));
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => readStoredArray(RECENTLY_VIEWED_KEY));

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    const controller = new AbortController();
    const query = listToQuery(filters);

    fetch(`/api/listings?${query}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { listings: Listing[] }) => setListings(payload.listings ?? []))
      .catch(() => {
        setListings(initialListings);
      });

    return () => controller.abort();
  }, [filters, initialListings]);

  const toggleWishlist = useCallback((listingId: string) => {
    setWishlist((prev) =>
      prev.includes(listingId) ? prev.filter((item) => item !== listingId) : [...prev, listingId]
    );
  }, []);

  const onViewed = useCallback((listingId: string) => {
    setRecentlyViewed((prev) => [listingId, ...prev.filter((item) => item !== listingId)].slice(0, 20));
  }, []);

  const stats = useMemo(
    () => ({
      wishlistCount: wishlist.length,
      recentCount: recentlyViewed.length,
      total: listings.length,
    }),
    [wishlist.length, recentlyViewed.length, listings.length]
  );

  return (
    <div className="space-y-5">
      <FilterBar value={filters} onChange={setFilters} />

      <section className="card flex items-center justify-between text-sm">
        <p>
          Feed: <strong>{stats.total}</strong> listings
        </p>
        <div className="flex gap-4">
          <button type="button" onClick={() => toggleWishlist("demo")} className="rounded-lg border px-3 py-1">
            Wishlist {stats.wishlistCount}
          </button>
          <span>Recently viewed {stats.recentCount}</span>
        </div>
      </section>

      <section className="h-[86vh] snap-y snap-mandatory space-y-4 overflow-y-auto">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} onViewed={onViewed} />
        ))}
      </section>

      <ChatInitiatePanel listings={listings} />
    </div>
  );
}