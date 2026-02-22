import { PerformanceGraph } from "@/components/dashboard/performance-graph";
import { computeFutureAds, computeHotDealCredits } from "@/lib/business/credits";
import { computeConversionRate } from "@/lib/business/pricing";
import { getListings } from "@/lib/data/listings";

export const dynamic = "force-dynamic";

const points = [
  { day: "Mon", views: 60 },
  { day: "Tue", views: 74 },
  { day: "Wed", views: 40 },
  { day: "Thu", views: 88 },
  { day: "Fri", views: 95 },
  { day: "Sat", views: 110 },
  { day: "Sun", views: 71 },
];

export default async function DashboardPage() {
  const listings = await getListings({ sort: "latest" });
  const totalViews = listings.reduce((acc, item) => acc + item.views, 0);
  const totalChats = listings.reduce((acc, item) => acc + item.chatCount, 0);
  const totalCalls = listings.reduce((acc, item) => acc + item.callClicks, 0);
  const conversionRate = computeConversionRate(totalChats, totalCalls, totalViews);

  const futureAds = computeFutureAds(8);
  const hotDeal = computeHotDealCredits(listings.length);

  return (
    <main className="app-shell space-y-5 py-5">
      <h1 className="text-2xl font-bold">Dealer Dashboard</h1>

      <section className="grid gap-3 md:grid-cols-5">
        <Tile label="Views" value={totalViews.toLocaleString("en-IN")} />
        <Tile label="Chats" value={totalChats.toLocaleString("en-IN")} />
        <Tile label="Call Clicks" value={totalCalls.toLocaleString("en-IN")} />
        <Tile label="Conversion" value={`${conversionRate}%`} />
        <Tile label="Active Listings" value={listings.length.toString()} />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">Future Ads</h2>
          <p className="mt-2 text-3xl font-bold text-accent">{futureAds.credits}</p>
          <p className="text-sm text-muted">Valid until {new Date(futureAds.validUntil).toDateString()}</p>
          <p className="mt-1 text-xs text-muted">Rule: Every successful deal gives +5 future ads for 30 days.</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Hot Deal Credits</h2>
          <p className="mt-2 text-3xl font-bold text-accent">{hotDeal.credits}</p>
          <p className="text-sm text-muted">Each credit boosts one listing for {hotDeal.boostHours} hours.</p>
          <p className="mt-1 text-xs text-muted">Rule: Every 10 listings gives 1 hot deal credit.</p>
        </div>
      </section>

      <PerformanceGraph points={points} />
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <article className="card">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </article>
  );
}