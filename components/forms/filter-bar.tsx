"use client";

import type { ChangeEvent, JSX } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type FilterState = {
  q: string;
  minPrice: string;
  maxPrice: string;
  fuel: string;
  year: string;
  sort: string;
};

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-6">
      <Input
        placeholder="Search"
        value={filters.q}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...filters, q: event.target.value })}
      />
      <Input
        placeholder="Min Price"
        value={filters.minPrice}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...filters, minPrice: event.target.value })}
      />
      <Input
        placeholder="Max Price"
        value={filters.maxPrice}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...filters, maxPrice: event.target.value })}
      />
      <Select value={filters.fuel} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange({ ...filters, fuel: event.target.value })}>
        <option value="">Fuel</option>
        <option value="PETROL">Petrol</option>
        <option value="DIESEL">Diesel</option>
        <option value="CNG">CNG</option>
        <option value="ELECTRIC">Electric</option>
        <option value="HYBRID">Hybrid</option>
      </Select>
      <Input
        placeholder="Year"
        value={filters.year}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...filters, year: event.target.value })}
      />
      <Select value={filters.sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange({ ...filters, sort: event.target.value })}>
        <option value="newest">Newest</option>
        <option value="price_asc">Price Low-High</option>
        <option value="price_desc">Price High-Low</option>
      </Select>
    </div>
  );
}
