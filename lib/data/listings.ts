import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing, ListingFilters } from "@/types/domain";

const demoListings: Listing[] = [
  {
    id: "demo-1",
    dealerId: "dealer-1",
    title: "2020 Hyundai i20 Sportz",
    description: "Single owner, service record available.",
    make: "Hyundai",
    model: "i20",
    year: 2020,
    city: "Bengaluru",
    state: "Karnataka",
    price: 640000,
    km: 38000,
    fuelType: "Petrol",
    transmission: "Manual",
    ownerType: "1st",
    insuranceType: "Full till Dec 2026",
    registrationNumber: "KA01AB1234",
    mediaUrls: ["https://images.unsplash.com/photo-1502877338535-766e1452684a"],
    videoUrl: null,
    isHotDeal: true,
    hotDealExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    createdAt: new Date().toISOString(),
    views: 220,
    chatCount: 30,
    callClicks: 14,
  },
  {
    id: "demo-2",
    dealerId: "dealer-2",
    title: "2018 Honda City VX CVT",
    description: "Excellent condition, dealer maintained.",
    make: "Honda",
    model: "City",
    year: 2018,
    city: "Hyderabad",
    state: "Telangana",
    price: 730000,
    km: 62000,
    fuelType: "Petrol",
    transmission: "Automatic",
    ownerType: "2nd",
    insuranceType: "Third-party",
    registrationNumber: "TS09CD8877",
    mediaUrls: ["https://images.unsplash.com/photo-1549924231-f129b911e442"],
    videoUrl: "https://cdn.coverr.co/videos/coverr-aerial-shot-of-a-car-driving-down-the-road-1579/1080p.mp4",
    isHotDeal: false,
    hotDealExpiresAt: null,
    status: "active",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    views: 170,
    chatCount: 18,
    callClicks: 8,
  },
];

function applyFilters(listings: Listing[], filters: ListingFilters) {
  const filtered = listings.filter((item) => {
    if (filters.minPrice && item.price < filters.minPrice) return false;
    if (filters.maxPrice && item.price > filters.maxPrice) return false;
    if (filters.minKm && item.km < filters.minKm) return false;
    if (filters.maxKm && item.km > filters.maxKm) return false;
    if (filters.fuelType && item.fuelType !== filters.fuelType) return false;
    if (filters.transmission && item.transmission !== filters.transmission) return false;
    if (filters.ownerType && item.ownerType !== filters.ownerType) return false;
    if (filters.city && item.city !== filters.city) return false;
    if (filters.state && item.state !== filters.state) return false;
    return item.status === "active";
  });

  switch (filters.sort) {
    case "price_asc":
      return filtered.sort((a, b) => a.price - b.price);
    case "price_desc":
      return filtered.sort((a, b) => b.price - a.price);
    case "hot_deals":
      return filtered.sort((a, b) => Number(b.isHotDeal) - Number(a.isHotDeal));
    case "latest":
    default:
      return filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

function mapDbRow(row: Record<string, unknown>): Listing {
  return {
    id: String(row.id),
    dealerId: String(row.dealer_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    make: String(row.make),
    model: String(row.model),
    year: Number(row.year),
    city: String(row.city),
    state: String(row.state),
    price: Number(row.price),
    km: Number(row.km),
    fuelType: row.fuel_type as Listing["fuelType"],
    transmission: row.transmission as Listing["transmission"],
    ownerType: row.owner_type as Listing["ownerType"],
    insuranceType: String(row.insurance_type ?? "Insurance not specified"),
    registrationNumber: String(row.registration_number ?? ""),
    mediaUrls: Array.isArray(row.media_urls) ? (row.media_urls as string[]) : [],
    videoUrl: row.video_url ? String(row.video_url) : null,
    isHotDeal: Boolean(row.is_hot_deal),
    hotDealExpiresAt: row.hot_deal_expires_at ? String(row.hot_deal_expires_at) : null,
    status: row.status as Listing["status"],
    createdAt: String(row.created_at),
    views: Number(row.views ?? 0),
    chatCount: Number(row.chat_count ?? 0),
    callClicks: Number(row.call_clicks ?? 0),
  };
}

export async function getListings(filters: ListingFilters) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .limit(100);

    if (error) throw error;

    const rows = (data ?? []).map((row) => mapDbRow(row as Record<string, unknown>));
    return applyFilters(rows, filters);
  } catch {
    return applyFilters([...demoListings], filters);
  }
}

export async function getListingById(listingId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();
    if (error || !data) return null;
    return mapDbRow(data as Record<string, unknown>);
  } catch {
    return demoListings.find((listing) => listing.id === listingId) ?? null;
  }
}