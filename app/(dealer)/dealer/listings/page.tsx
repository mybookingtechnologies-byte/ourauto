"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Car = {
  id: string;
  title: string;
  city: string;
  price: string;
  status: "ACTIVE" | "SOLD" | "DRAFT";
  isActive: boolean;
  isHotDeal: boolean;
  isFutureAd: boolean;
};

type PromoteStats = {
  hotDealCredits: number;
  futureAdCredits: number;
  totalListings: number;
  hotDealMilestone: number;
};

export default function DealerListingsPage(): JSX.Element {
  const [cars, setCars] = useState<Car[]>([]);
  const [stats, setStats] = useState<PromoteStats>({ hotDealCredits: 0, futureAdCredits: 0, totalListings: 0, hotDealMilestone: 10 });

  const load = async (): Promise<void> => {
    const [carsResponse, statsResponse] = await Promise.all([fetch("/api/dealer/cars"), fetch("/api/dealer/promote/status")]);
    if (carsResponse.ok) {
      const data = (await carsResponse.json()) as { cars: Car[] };
      setCars(data.cars);
    }
    if (statsResponse.ok) {
      const data = (await statsResponse.json()) as { stats: PromoteStats };
      setStats(data.stats);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">My Listings</h1>
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">Hot Deal Credits: {stats.hotDealCredits}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">Future Ad Credits: {stats.futureAdCredits}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">Total Listings: {stats.totalListings}</div>
      </div>
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        You are {stats.hotDealMilestone - (stats.totalListings % stats.hotDealMilestone)} listings away from next Hot Deal.
      </div>
      <div className="space-y-3">
        {cars.map((car) => (
          <ListingItem key={car.id} car={car} stats={stats} onRefresh={load} />
        ))}
      </div>
    </main>
  );
}

type ListingItemProps = {
  car: Car;
  stats: PromoteStats;
  onRefresh: () => Promise<void>;
};

function ListingItem({ car, stats, onRefresh }: ListingItemProps): JSX.Element {
  const [title, setTitle] = useState(car.title);
  const [city, setCity] = useState(car.city);
  const [price, setPrice] = useState(car.price);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-3 md:grid-cols-4">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input value={city} onChange={(event) => setCity(event.target.value)} />
        <Input value={price} onChange={(event) => setPrice(event.target.value)} />
        <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">{car.status}</div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          onClick={async () => {
            await fetch(`/api/dealer/cars/${car.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, city, price: Number(price) }),
            });
            await onRefresh();
          }}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await fetch(`/api/dealer/cars/${car.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "sold" }),
            });
            await onRefresh();
          }}
        >
          Mark Sold
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await fetch(`/api/dealer/cars/${car.id}`, { method: "DELETE" });
            await onRefresh();
          }}
        >
          Delete
        </Button>
        <Button
          variant="secondary"
          disabled={stats.hotDealCredits <= 0 || car.status !== "ACTIVE" || !car.isActive}
          onClick={async () => {
            await fetch("/api/dealer/promote/hot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ carId: car.id }),
            });
            await onRefresh();
          }}
        >
          {car.isHotDeal ? "Hot Deal Active" : "Activate Hot Deal"}
        </Button>
        <Button
          variant="secondary"
          disabled={stats.futureAdCredits <= 0 || car.status !== "ACTIVE" || !car.isActive}
          onClick={async () => {
            await fetch("/api/dealer/promote/future", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ carId: car.id }),
            });
            await onRefresh();
          }}
        >
          {car.isFutureAd ? "Future Ad Active" : "Activate Future Ad"}
        </Button>
      </div>
    </div>
  );
}
