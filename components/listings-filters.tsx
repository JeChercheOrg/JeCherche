"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

interface ListingsFiltersProps {
  locale: string;
  translations: {
    priceMin: string;
    priceMax: string;
    sortLabel: string;
    sortNewest: string;
    sortOldest: string;
    sortCheapest: string;
    sortExpensive: string;
  };
}

export function ListingsFilters({ locale, translations }: ListingsFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") || "");

  const currentSort = searchParams.get("sort") || "newest";

  function applyFilters(overrides?: { sort?: string }) {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const category = searchParams.get("category");

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);

    const sort = overrides?.sort ?? currentSort;
    if (sort && sort !== "newest") params.set("sort", sort);

    const qs = params.toString();
    router.push(`/${locale}/listings${qs ? `?${qs}` : ""}`);
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    applyFilters({ sort: e.target.value });
  }

  function handlePriceBlur() {
    applyFilters();
  }

  function handlePriceKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          placeholder={translations.priceMin}
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          onBlur={handlePriceBlur}
          onKeyDown={handlePriceKeyDown}
          className="w-24 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-text-tertiary text-sm">–</span>
        <input
          type="number"
          min="0"
          placeholder={translations.priceMax}
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          onBlur={handlePriceBlur}
          onKeyDown={handlePriceKeyDown}
          className="w-24 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <select
        value={currentSort}
        onChange={handleSortChange}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="newest">{translations.sortNewest}</option>
        <option value="oldest">{translations.sortOldest}</option>
        <option value="cheapest">{translations.sortCheapest}</option>
        <option value="expensive">{translations.sortExpensive}</option>
      </select>
    </div>
  );
}
