type Props = {
  totalDealers: number;
  totalListings: number;
  activeToday: number;
};

export function AdminDashboard({ totalDealers, totalListings, activeToday }: Props): JSX.Element {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-4 text-xl font-semibold">Admin Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Total Dealers: {totalDealers}</div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Total Listings: {totalListings}</div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Active Today: {activeToday}</div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Revenue: ₹0</div>
      </div>
    </section>
  );
}
