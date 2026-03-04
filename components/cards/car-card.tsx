"use client";

import Link from "next/link";
import Image from "next/image";
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
  isHotDeal: boolean;
  isFutureAd: boolean;
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
    <Card className={car.isHotDeal ? "border-red-300 dark:border-red-700" : undefined}>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={images[activeIndex]?.url}
          alt={car.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          unoptimized
        />
        <div className="absolute left-2 top-2 flex gap-2">
          {car.isUrgent ? <Badge>Urgent</Badge> : null}
          {car.isHotDeal ? <Badge className="bg-red-600 text-white">🔥 Hot Deal</Badge> : null}
          {car.isFutureAd ? <Badge className="bg-blue-600 text-white">🚀 Future Ad</Badge> : null}
          {car.verifiedDealer ? <Badge className="bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">Verified</Badge> : null}
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
              className={`h-2 w-6 rounded-full ${activeIndex === index ? "bg-yellow-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Image ${index + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dealer/cars/${car.id}`} className="text-sm text-yellow-500 transition-all duration-300 hover:text-yellow-400">
            View Details
          </Link>
          <Button onClick={() => onInquire(car.id)}>Inquire</Button>
        </div>
      </div>
    </Card>
  );
}
