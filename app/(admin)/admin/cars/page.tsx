"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Car = {
  id: string;
  brand: string;
  model: string;
  city: string;
  isFeatured: boolean;
  dealer: { dealerName: string | null; businessName: string | null };
};

export default function AdminCarsPage(): JSX.Element {
  const [cars, setCars] = useState<Car[]>([]);

  const load = async (): Promise<void> => {
    const response = await fetch("/api/admin/cars");
    if (!response.ok) return;
    const data = (await response.json()) as { cars: Car[] };
    setCars(data.cars);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Car Moderation</h1>
      <div className="space-y-3">
        {cars.map((car) => (
          <div key={car.id} className="flex items-center justify-between rounded-2xl bg-bgSecondary p-6 shadow-lg">
            <div>
              <h2 className="font-semibold">{car.brand} {car.model}</h2>
              <p className="text-sm text-zinc-500">{car.city} • {car.dealer.businessName || car.dealer.dealerName}</p>
            </div>
            <div className="flex gap-2">
              {!car.isFeatured ? <Button onClick={async () => { await fetch("/api/admin/cars", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carId: car.id, action: "FEATURE" }) }); await load(); }}>Feature</Button> : null}
              <Button variant="outline" onClick={async () => { await fetch("/api/admin/cars", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carId: car.id, action: "DELETE" }) }); await load(); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
