"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Car = {
  id: string;
  title: string;
  city: string;
  isFeatured: boolean;
  dealer: { dealerName: string | null; businessName: string | null };
};

export function ListingModeration(): JSX.Element {
  const [cars, setCars] = useState<Car[]>([]);

  const load = async (): Promise<void> => {
    const response = await fetch("/api/admin/cars", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { cars: Car[] };
    setCars(data.cars);
  };

  useEffect(() => {
    void load();
  }, []);

  const pendingVerification = useMemo(() => cars.filter((car) => !car.isFeatured).length, [cars]);
  const flaggedListings = 0;

  const remove = async (carId: string): Promise<void> => {
    await fetch("/api/admin/cars", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carId, action: "DELETE" }),
    });
    await load();
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-4 text-xl font-semibold">Listing Moderation</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm">Pending verification: {pendingVerification}</div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm">Flagged listings: {flaggedListings}</div>
      </div>
      <div className="space-y-3">
        {cars.slice(0, 10).map((car) => (
          <div key={car.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
            <div>
              <p className="font-medium">{car.title}</p>
              <p className="text-zinc-400">{car.city} • {car.dealer.businessName || car.dealer.dealerName || "Dealer"}</p>
            </div>
            <Button size="sm" variant="outline" onClick={async () => { await remove(car.id); }}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
