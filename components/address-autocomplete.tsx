"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X, LocateFixed, Loader2 } from "lucide-react";
import { reverseGeocode, searchAddress } from "@/app/actions/geocode";

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
  geolocateMessages?: {
    denied: string;
    unavailable: string;
    noResult: string;
    error: string;
    locating: string;
  };
}

const DEFAULT_GEO_MESSAGES = {
  denied: "Location access denied. Allow location access or enter your city.",
  unavailable: "Could not get your location. Try again or enter your city.",
  noResult: "No address found for your location. Please enter your city manually.",
  error: "Something went wrong while locating you. Please try again.",
  locating: "Locating you…",
};

export function AddressAutocomplete({
  onSelect,
  defaultCity,
  defaultPostalCode,
  label,
  placeholder,
  geolocateLabel,
  geolocateMessages,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(
    defaultCity ? `${defaultCity} ${defaultPostalCode || ""}`.trim() : ""
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(!!defaultCity);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const geoMessages = geolocateMessages || DEFAULT_GEO_MESSAGES;

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
    setGeoError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { results } = await searchAddress(value);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function handleSelect(suggestion: Suggestion) {
    setQuery(`${suggestion.city} ${suggestion.postcode}`);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    setGeoError(null);
    onSelect(suggestion.city, suggestion.postcode, suggestion.lat, suggestion.lng);
  }

  function handleClear() {
    setQuery("");
    setSelected(false);
    setSuggestions([]);
    setGeoError(null);
    onSelect("", "", null, null);
  }

  async function handleGeolocate() {
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError(geoMessages.unavailable);
      return;
    }

    setGeolocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { result, error } = await reverseGeocode(latitude, longitude);
          if (result) {
            setQuery(`${result.city} ${result.postcode}`.trim());
            setSelected(true);
            setOpen(false);
            onSelect(result.city, result.postcode, result.lat, result.lng);
          } else {
            setGeoError(error === "noResult" ? geoMessages.noResult : geoMessages.error);
          }
        } catch {
          setGeoError(geoMessages.error);
        } finally {
          setGeolocating(false);
        }
      },
      (err) => {
        setGeolocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? geoMessages.denied
            : geoMessages.unavailable
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
          {searching && !selected && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-text-tertiary" />
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
            {geolocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {geolocating && (
        <p className="text-xs text-text-tertiary flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          {geoMessages.locating}
        </p>
      )}

      {geoError && (
        <p className="text-xs text-error" role="alert">
          {geoError}
        </p>
      )}

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
