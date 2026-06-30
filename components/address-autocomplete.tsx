"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X, LocateFixed } from "lucide-react";

interface Suggestion {
  label: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  onSelect: (city: string, postalCode: string, lat: number | null, lng: number | null) => void;
  defaultCity?: string;
  defaultPostalCode?: string;
  label: string;
  placeholder: string;
  geolocateLabel?: string;
}

export function AddressAutocomplete({
  onSelect,
  defaultCity,
  defaultPostalCode,
  label,
  placeholder,
  geolocateLabel,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(
    defaultCity ? `${defaultCity} ${defaultPostalCode || ""}`.trim() : ""
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(!!defaultCity);
  const [geolocating, setGeolocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setSelected(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&type=municipality&limit=5`
        );
        const data = await res.json();
        const items: Suggestion[] = (data.features || []).map(
          (f: { properties: { label: string; city: string; postcode: string }; geometry: { coordinates: number[] } }) => ({
            label: f.properties.label,
            city: f.properties.city,
            postcode: f.properties.postcode,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          })
        );
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);
  }

  function handleSelect(suggestion: Suggestion) {
    setQuery(`${suggestion.city} ${suggestion.postcode}`);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    onSelect(suggestion.city, suggestion.postcode, suggestion.lat, suggestion.lng);
  }

  function handleClear() {
    setQuery("");
    setSelected(false);
    setSuggestions([]);
    onSelect("", "", null, null);
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return;
    setGeolocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`
          );
          const data = await res.json();
          const feature = data.features?.[0];
          if (feature) {
            const city = feature.properties.city;
            const postcode = feature.properties.postcode;
            const lat = feature.geometry.coordinates[1];
            const lng = feature.geometry.coordinates[0];
            setQuery(`${city} ${postcode}`);
            setSelected(true);
            onSelect(city, postcode, lat, lng);
          }
        } catch {
          // silently fail
        } finally {
          setGeolocating(false);
        }
      },
      () => setGeolocating(false),
      { timeout: 10000 }
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={placeholder}
            className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-9 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
          />
          {selected && query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {geolocateLabel && (
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geolocating}
            className="h-11 px-3 rounded-md border border-border bg-surface text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50"
            title={geolocateLabel}
          >
            <LocateFixed className={`h-4 w-4 ${geolocating ? "animate-pulse" : ""}`} />
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-surface shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full px-3 py-2.5 text-left text-sm text-text-primary hover:bg-primary-light/50 transition-colors flex items-center gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
