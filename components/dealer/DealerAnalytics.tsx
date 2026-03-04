import { StatCard } from "@/components/dealer/StatCard";

type DealerAnalyticsProps = {
  totalListings: number;
  activeListings: number;
  totalInquiries: number;
};

export function DealerAnalytics({ totalListings, activeListings, totalInquiries }: DealerAnalyticsProps): JSX.Element {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all duration-300">
      <h2 className="mb-4 text-xl font-semibold">Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Listings" value={totalListings} />
        <StatCard label="Active Listings" value={activeListings} />
        <StatCard label="Total Inquiries" value={totalInquiries} />
        <StatCard label="Conversion" value="--" />
        <StatCard label="Monthly Growth" value="--" />
      </div>
    </section>
  );
}
