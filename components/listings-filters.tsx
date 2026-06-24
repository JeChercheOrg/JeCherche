"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { MapPin, Truck, CheckCircle } from "lucide-react";

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
    cityFilter: string;
    deliveryFilter: string;
    radiusLabel: string;
    showFound: string;
  };
}

interface CitySuggestion {
  label: string;
  city: string;
  lat: number;
  lng: number;
}

export function ListingsFilters({ locale, translations }: ListingsFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") || "");
  const [cityQuery, setCityQuery] = useState(searchParams.get("city") || "");
  const [cityLat, setCityLat] = useState(searchParams.get("lat") || "");
  const [cityLng, setCityLng] = useState(searchParams.get("lng") || "");
  const [radius, setRadius] = useState(searchParams.get("radius") || "");
  const [delivery, setDelivery] = useState(searchParams.get("delivery") === "true");
  const [showFound, setShowFound] = useState(searchParams.get("show_found") === "true");

  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") || "newest";

  function buildParams(overrides?: { sort?: string; delivery?: boolean; showFound?: boolean; radius?: string; cityLat?: string; cityLng?: string; cityQuery?: string }) {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const category = searchParams.get("category");

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);

    const cq = overrides?.cityQuery ?? cityQuery;
    if (cq) params.set("city", cq);

    const cLat = overrides?.cityLat ?? cityLat;
    const cLng = overrides?.cityLng ?? cityLng;
    const r = overrides?.radius ?? radius;

    if (cLat && cLng) {
      params.set("lat", cLat);
      params.set("lng", cLng);
    }
    if (r) params.set("radius", r);

    const deliveryVal = overrides?.delivery ?? delivery;
    if (deliveryVal) params.set("delivery", "true");

    const showFoundVal = overrides?.showFound ?? showFound;
    if (showFoundVal) params.set("show_found", "true");

    const sort = overrides?.sort ?? currentSort;
    if (sort && sort !== "newest") params.set("sort", sort);

    return params;
  }

  function navigate(overrides?: { sort?: string; delivery?: boolean; showFound?: boolean; radius?: string; cityLat?: string; cityLng?: string; cityQuery?: string }) {
    const params = buildParams(overrides);
    const qs = params.toString();
    router.push(`/${locale}/listings${qs ? `?${qs}` : ""}`);
  }

  function handleCityChange(value: string) {
    setCityQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (value.trim().length === 0 && cityQuery) {
        setCityLat("");
        setCityLng("");
        setRadius("");
        navigate({ cityQuery: "", cityLat: "", cityLng: "", radius: "" });
      }
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&type=municipality&limit=5`
        );
        const data = await res.json();
        const items: CitySuggestion[] = (data.features || []).map(
          (f: { properties: { label: string; city: string }; geometry: { coordinates: number[] } }) => ({
            label: f.properties.label,
            city: f.properties.city,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          })
        );
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  function handleCitySelect(suggestion: CitySuggestion) {
    setCityQuery(suggestion.city);
    setCityLat(suggestion.lat.toString());
    setCityLng(suggestion.lng.toString());
    setShowSuggestions(false);
    setSuggestions([]);
    navigate({
      cityQuery: suggestion.city,
      cityLat: suggestion.lat.toString(),
      cityLng: suggestion.lng.toString(),
      radius: radius || "25",
    });
    if (!radius) setRadius("25");
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate({ sort: e.target.value });
  }

  function handlePriceBlur() {
    navigate();
  }

  function handlePriceKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate();
    }
  }

  function handleRadiusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setRadius(e.target.value);
    navigate({ radius: e.target.value });
  }

  function handleDeliveryToggle() {
    const newVal = !delivery;
    setDelivery(newVal);
    navigate({ delivery: newVal });
  }

  function handleShowFoundToggle() {
    const newVal = !showFound;
    setShowFound(newVal);
    navigate({ showFound: newVal });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* City + radius */}
      <div ref={containerRef} className="relative flex items-center gap-1.5">
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input
            type="text"
            placeholder={translations.cityFilter}
            value={cityQuery}
            onChange={(e) => handleCityChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-36 rounded-lg border border-border bg-surface pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {showSuggestions && (
            <ul className="absolute z-50 top-full mt-1 w-56 rounded-md border border-border bg-surface shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => handleCitySelect(s)}
                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-primary-light/50 transition-colors"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cityLat && (
          <select
            value={radius || "25"}
            onChange={handleRadiusChange}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
          </select>
        )}
      </div>

      {/* Price range */}
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

      {/* Delivery chip */}
      <button
        type="button"
        onClick={handleDeliveryToggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${delivery
            ? "border-primary bg-primary-light text-primary-text"
            : "border-border bg-surface text-text-secondary hover:border-border-hover"
          }`}
      >
        <Truck className="h-3.5 w-3.5" />
        {translations.deliveryFilter}
      </button>

      {/* Show found chip */}
      <button
        type="button"
        onClick={handleShowFoundToggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${showFound
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-border bg-surface text-text-secondary hover:border-border-hover"
          }`}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        {translations.showFound}
      </button>

      {/* Sort */}
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
