"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CarCard, type PublicCar } from "@/components/cards/car-card";
import { FilterBar, type FilterState } from "@/components/forms/filter-bar";
import { InquiryModal } from "@/components/forms/inquiry-modal";

type CarsResponse = {
  cars: PublicCar[];
  nextCursor: string | null;
};

const initialFilters: FilterState = {
  q: "",
  minPrice: "",
  maxPrice: "",
  fuel: "",
  year: "",
  sort: "newest",
};

export function PublicListings(): JSX.Element {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [cars, setCars] = useState<PublicCar[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    query.set("limit", "12");
    if (filters.q) query.set("q", filters.q);
    if (filters.minPrice) query.set("minPrice", filters.minPrice);
    if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);
    if (filters.fuel) query.set("fuel", filters.fuel);
    if (filters.year) query.set("year", filters.year);
    if (filters.sort) query.set("sort", filters.sort);
    return query;
  }, [filters]);

  const loadCars = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      const query = new URLSearchParams(queryString);
      if (!reset && cursor) {
        query.set("cursor", cursor);
      }
      const response = await fetch(`/api/public/cars?${query.toString()}`);
      const data = (await response.json()) as CarsResponse;
      setCars((prev) => (reset ? data.cars : [...prev, ...data.cars]));
      setCursor(data.nextCursor);
      setLoading(false);
      loadingRef.current = false;
    },
    [cursor, queryString],
  );

  useEffect(() => {
    setCursor(null);
    void loadCars(true);
  }, [queryString, loadCars]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first?.isIntersecting && cursor) {
        void loadCars(false);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [cursor, loadCars]);

  return (
    <section className="py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <FilterBar filters={filters} onChange={setFilters} />
        {loading && cars.length === 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-bgSecondary p-4 shadow-lg">
                <div className="aspect-video animate-pulse rounded-xl bg-zinc-300 dark:bg-zinc-800" />
                <div className="mt-4 h-4 animate-pulse rounded bg-zinc-300 dark:bg-zinc-800" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-zinc-300 dark:bg-zinc-800" />
                <div className="mt-4 h-10 animate-pulse rounded bg-zinc-300 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && cars.length === 0 ? (
          <div className="mt-8 grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-zinc-300 bg-bgSecondary/40 p-6 text-center dark:border-zinc-700">
            <p className="text-base font-medium">No Cars Found</p>
          </div>
        ) : null}

        {cars.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} onInquire={setSelectedCarId} />
            ))}
          </div>
        ) : null}
        <div ref={sentinelRef} className="h-10" />
      </div>
      <InquiryModal carId={selectedCarId} onClose={() => setSelectedCarId(null)} />
    </section>
  );
}
