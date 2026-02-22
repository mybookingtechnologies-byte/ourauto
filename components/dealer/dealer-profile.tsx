import Image from "next/image";
import { DealerBadgePill } from "@/components/ui/badge";
import type { Dealer } from "@/types/domain";

export function DealerProfile({ dealer }: { dealer: Dealer }) {
  return (
    <section className="card overflow-hidden p-0">
      <div className="relative h-40 w-full bg-black/10 dark:bg-white/10">
        {dealer.coverImageUrl && (
          <Image src={dealer.coverImageUrl} alt={dealer.name} fill className="object-cover" unoptimized />
        )}
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {dealer.profilePhotoUrl ? (
              <Image
                src={dealer.profilePhotoUrl}
                alt={dealer.name}
                className="h-14 w-14 rounded-full object-cover"
                width={56}
                height={56}
                unoptimized
              />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full bg-black/10">D</div>
            )}
            <div>
              <h1 className="text-xl font-bold">{dealer.name}</h1>
              <p className="text-sm text-muted">
                {dealer.city}, {dealer.state}
              </p>
            </div>
          </div>
          <DealerBadgePill badge={dealer.badge} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Total Listings" value={dealer.totalListings.toString()} />
          <Metric label="Rating" value={dealer.rating.toFixed(1)} />
          <Metric label="Sold Ratio" value={`${Math.round(dealer.soldRatio * 100)}%`} />
          <Metric label="Response Time" value={`${dealer.responseTimeMinutes} min`} />
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto">
          <StoryTag text="New Arrival" />
          <StoryTag text="Hot Deal" accent />
          <StoryTag text="Sold" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-3 text-center dark:border-white/10">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function StoryTag({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <span
      className={`rounded-full border px-4 py-2 text-sm ${
        accent ? "border-accent bg-accent text-black" : "border-black/20"
      }`}
    >
      {text}
    </span>
  );
}