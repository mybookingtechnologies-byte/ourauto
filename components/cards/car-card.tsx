"use client";

import type { JSX } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type PublicCar = {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  fuel: string;
  city: string;
  price: string;
  isUrgent: boolean;
  verifiedDealer: boolean;
  media: Array<{ id: string; url: string }>;
};

interface Props {
  car: PublicCar;
  onInquire: (carId: string) => void;
}

export function CarCard({ car, onInquire }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = useMemo<Array<{ id: string; url: string }>>(
    () => (car.media.length ? car.media : [{ id: "fallback", url: "https://placehold.co/1280x720?text=No+Image" }]),
    [car.media],
  );

  return (
    <Card>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <img src={images[activeIndex]?.url} alt={car.title} className="h-full w-full object-cover" />
        <div className="absolute left-2 top-2 flex gap-2">
          {car.isUrgent ? <Badge>Urgent</Badge> : null}
          {car.verifiedDealer ? <Badge className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black">Verified</Badge> : null}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{car.brand} {car.model}</h3>
          <p className="text-sm text-zinc-500">{car.title}</p>
        </div>
        <div className="text-lg font-bold text-accent">₹{car.price}</div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-zinc-500">
        <span>{car.year}</span>
        <span>{car.km} km</span>
        <span>{car.fuel}</span>
        <span>{car.city}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              className={`h-2 w-6 rounded-full ${activeIndex === index ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-700"}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Image ${index + 1}`}
            />
          ))}
        </div>
        <Button onClick={() => onInquire(car.id)}>Inquire</Button>
      </div>
    </Card>
  );
}
