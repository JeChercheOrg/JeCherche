"use server";

interface ReverseResult {
  city: string;
  postcode: string;
  lat: number;
  lng: number;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ result?: ReverseResult; error?: "noResult" | "error" }> {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return { error: "error" };
  }

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return { error: "error" };
    }

    const data = await res.json();
    const feature = data.features?.[0];
    const city: string | undefined = feature?.properties?.city;
    const coords: number[] | undefined = feature?.geometry?.coordinates;

    if (!feature || !city || !coords) {
      return { error: "noResult" };
    }

    return {
      result: {
        city,
        postcode: feature.properties?.postcode || "",
        lat: coords[1],
        lng: coords[0],
      },
    };
  } catch {
    return { error: "error" };
  }
}

interface AddressSuggestion {
  label: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
}

export async function searchAddress(
  query: string
): Promise<{ results: AddressSuggestion[] }> {
  const trimmed = (query || "").trim();
  if (trimmed.length < 2) {
    return { results: [] };
  }

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        trimmed
      )}&type=municipality&limit=5`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return { results: [] };
    }

    const data = await res.json();
    const results: AddressSuggestion[] = (data.features || [])
      .map(
        (f: {
          properties?: { label?: string; city?: string; postcode?: string };
          geometry?: { coordinates?: number[] };
        }) => ({
          label: f.properties?.label || "",
          city: f.properties?.city || "",
          postcode: f.properties?.postcode || "",
          lat: f.geometry?.coordinates?.[1] ?? 0,
          lng: f.geometry?.coordinates?.[0] ?? 0,
        })
      )
      .filter((s: AddressSuggestion) => s.city);

    return { results };
  } catch {
    return { results: [] };
  }
}

