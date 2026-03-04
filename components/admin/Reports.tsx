type GroupRow = {
  value: string;
  count: number;
};

type Props = {
  topCities: GroupRow[];
  topBrands: GroupRow[];
  growthMetric: string;
};

export function Reports({ topCities, topBrands, growthMetric }: Props): JSX.Element {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-4 text-xl font-semibold">Reports</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-300">Top Cities</h3>
          <div className="space-y-1 text-sm text-zinc-400">
            {topCities.length > 0 ? topCities.map((row) => <p key={row.value}>{row.value}: {row.count}</p>) : <p>No data</p>}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-300">Most Listed Brands</h3>
          <div className="space-y-1 text-sm text-zinc-400">
            {topBrands.length > 0 ? topBrands.map((row) => <p key={row.value}>{row.value}: {row.count}</p>) : <p>No data</p>}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-300">Growth Metrics</h3>
          <p className="text-sm text-zinc-400">{growthMetric}</p>
        </div>
      </div>
    </section>
  );
}
