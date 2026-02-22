import Link from "next/link";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getListings } from "@/lib/data/listings";
import { getRequestLocation } from "@/lib/location";

export const dynamic = "force-dynamic";

export default async function Home() {
  const location = await getRequestLocation();
  const listings = await getListings({
    sort: "latest",
    city: location.city,
    state: location.state,
  });

  return (
    <main className="app-shell py-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted">Dealer-only Marketplace</p>
          <h1 className="text-2xl font-bold">OurAuto</h1>
          <p className="text-sm text-muted">
            Location detected: {location.city}, {location.state}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/listings/new" className="cta">
            Add Listing
          </Link>
          <Link href="/dashboard" className="rounded-xl border border-black/10 px-4 py-2 dark:border-white/15">
            Dashboard
          </Link>
        </div>
      </header>

      <MarketplaceClient
        initialListings={listings}
        defaultCity={location.city}
        defaultState={location.state}
      />
    </main>
  );
}
