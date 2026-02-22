import { notFound } from "next/navigation";
import { DealerProfile } from "@/components/dealer/dealer-profile";
import { getDealerById } from "@/lib/data/dealers";
import { getListings } from "@/lib/data/listings";

export const dynamic = "force-dynamic";

export default async function DealerPage({ params }: { params: Promise<{ dealerId: string }> }) {
  const { dealerId } = await params;
  const dealer = await getDealerById(dealerId);

  if (!dealer) {
    notFound();
  }

  const listings = await getListings({ sort: "latest" });
  const dealerListings = listings.filter((item) => item.dealerId === dealerId);

  return (
    <main className="app-shell py-5 space-y-5">
      <DealerProfile dealer={dealer} />

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Listings ({dealerListings.length})</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {dealerListings.map((listing) => (
            <article key={listing.id} className="rounded-xl border border-black/10 p-3 dark:border-white/10">
              <h3 className="font-semibold">{listing.title}</h3>
              <p className="text-sm text-muted">
                ₹{listing.price.toLocaleString("en-IN")} · {listing.km.toLocaleString("en-IN")} KM
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}