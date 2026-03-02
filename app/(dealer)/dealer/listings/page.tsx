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
};

export default function DealerListingsPage(): JSX.Element {
  const [cars, setCars] = useState<Car[]>([]);

  const load = async (): Promise<void> => {
    const response = await fetch("/api/dealer/cars");
    if (!response.ok) return;
    const data = (await response.json()) as { cars: Car[] };
    setCars(data.cars);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">My Listings</h1>
      <div className="space-y-3">
        {cars.map((car) => (
          <ListingItem key={car.id} car={car} onRefresh={load} />
        ))}
      </div>
    </main>
  );
}

type ListingItemProps = {
  car: Car;
  onRefresh: () => Promise<void>;
};

function ListingItem({ car, onRefresh }: ListingItemProps): JSX.Element {
  const [title, setTitle] = useState(car.title);
  const [city, setCity] = useState(car.city);
  const [price, setPrice] = useState(car.price);

  return (
    <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">
      <div className="grid gap-3 md:grid-cols-4">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input value={city} onChange={(event) => setCity(event.target.value)} />
        <Input value={price} onChange={(event) => setPrice(event.target.value)} />
        <div className="rounded-2xl bg-bgPrimary px-3 py-2 text-sm">{car.status}</div>
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
      </div>
    </div>
  );
}
