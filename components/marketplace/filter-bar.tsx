"use client";

import type { ListingFilters } from "@/types/domain";

interface Props {
  value: ListingFilters;
  onChange: (next: ListingFilters) => void;
}

export function FilterBar({ value, onChange }: Props) {
  return (
    <section className="card sticky top-2 z-20 grid gap-3 md:grid-cols-4">
      <label className="text-sm">
        <span className="mb-1 block text-muted">Min Price</span>
        <input
          type="range"
          min={100000}
          max={5000000}
          step={50000}
          value={value.minPrice ?? 100000}
          onChange={(event) =>
            onChange({ ...value, minPrice: Number.parseInt(event.target.value, 10) })
          }
          className="w-full"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-muted">Max Price</span>
        <input
          type="range"
          min={200000}
          max={7000000}
          step={50000}
          value={value.maxPrice ?? 7000000}
          onChange={(event) =>
            onChange({ ...value, maxPrice: Number.parseInt(event.target.value, 10) })
          }
          className="w-full"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-muted">Min KM</span>
        <input
          type="range"
          min={0}
          max={200000}
          step={1000}
          value={value.minKm ?? 0}
          onChange={(event) =>
            onChange({ ...value, minKm: Number.parseInt(event.target.value, 10) })
          }
          className="w-full"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-muted">Max KM</span>
        <input
          type="range"
          min={10000}
          max={300000}
          step={1000}
          value={value.maxKm ?? 300000}
          onChange={(event) =>
            onChange({ ...value, maxKm: Number.parseInt(event.target.value, 10) })
          }
          className="w-full"
        />
      </label>

      <select
        value={value.fuelType ?? ""}
        onChange={(event) => onChange({ ...value, fuelType: (event.target.value || undefined) as ListingFilters["fuelType"] })}
        className="rounded-lg border border-black/10 bg-background p-2 text-sm dark:border-white/20"
      >
        <option value="">Fuel Type</option>
        <option value="Petrol">Petrol</option>
        <option value="Diesel">Diesel</option>
        <option value="CNG">CNG</option>
        <option value="Electric">Electric</option>
        <option value="Hybrid">Hybrid</option>
      </select>

      <select
        value={value.transmission ?? ""}
        onChange={(event) =>
          onChange({ ...value, transmission: (event.target.value || undefined) as ListingFilters["transmission"] })
        }
        className="rounded-lg border border-black/10 bg-background p-2 text-sm dark:border-white/20"
      >
        <option value="">Transmission</option>
        <option value="Manual">Manual</option>
        <option value="Automatic">Automatic</option>
      </select>

      <select
        value={value.ownerType ?? ""}
        onChange={(event) =>
          onChange({ ...value, ownerType: (event.target.value || undefined) as ListingFilters["ownerType"] })
        }
        className="rounded-lg border border-black/10 bg-background p-2 text-sm dark:border-white/20"
      >
        <option value="">Owner Type</option>
        <option value="1st">1st Owner</option>
        <option value="2nd">2nd Owner</option>
        <option value="3rd+">3rd+ Owner</option>
      </select>

      <select
        value={value.sort ?? "latest"}
        onChange={(event) => onChange({ ...value, sort: event.target.value as ListingFilters["sort"] })}
        className="rounded-lg border border-black/10 bg-background p-2 text-sm dark:border-white/20"
      >
        <option value="latest">Latest</option>
        <option value="price_asc">Price Low → High</option>
        <option value="price_desc">Price High → Low</option>
        <option value="hot_deals">Hot Deals</option>
      </select>
    </section>
  );
}