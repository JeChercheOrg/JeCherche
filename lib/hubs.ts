import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared building blocks for the programmatic SEO "hub" pages
 * (category, city and category x city landing pages under /recherche).
 *
 * These helpers are read-only: they never mutate Supabase. Category slugs are
 * derived from the localized category names (no DB column is required), so the
 * database schema stays untouched.
 */

export const HUB_PAGE_SIZE = 24;

// Static path segment that disambiguates city hubs from category hubs.
// `/recherche/villes/[city]` (static "villes" wins) vs `/recherche/[category]`.
export const CITY_SEGMENT = "villes";

export const HUB_LISTING_SELECT =
  "*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position), responses(count)";

export const HUB_LOCALES = ["fr", "en", "es", "de"] as const;
export type HubLocale = (typeof HUB_LOCALES)[number];

export type CategoryRow = {
  id: string;
  name: string;
  name_fr: string | null;
  name_es: string | null;
  name_de: string | null;
};

export type HubListing = {
  id: string;
  title: string;
  price: number;
  created_at: string;
  city?: string | null;
  postal_code?: string | null;
  status?: string;
  listing_images?: { storage_path: string; position: number }[];
  categories?: {
    name: string;
    name_fr: string | null;
    name_es: string | null;
    name_de: string | null;
  } | null;
  responses?: { count: number }[];
};

export type CityHub = { slug: string; name: string; count: number };

/** Turn any label into a URL-safe, accent-free, lowercase slug. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Escape Postgres LIKE/ILIKE wildcards so a value matches literally. */
function escapeLike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function getLocalizedCategoryName(
  category: CategoryRow,
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export function getCategorySlug(category: CategoryRow, locale: string): string {
  return slugify(getLocalizedCategoryName(category, locale));
}

/** Slug of a category in every locale (used to build hreflang alternates). */
export function getCategorySlugsByLocale(
  category: CategoryRow
): Record<HubLocale, string> {
  return {
    fr: getCategorySlug(category, "fr"),
    en: getCategorySlug(category, "en"),
    es: getCategorySlug(category, "es"),
    de: getCategorySlug(category, "de"),
  };
}

export async function fetchCategories(
  supabase: SupabaseClient
): Promise<CategoryRow[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, name_fr, name_es, name_de")
    .order("name");
  return (data ?? []) as CategoryRow[];
}

export async function resolveCategoryBySlug(
  supabase: SupabaseClient,
  slug: string,
  locale: string
): Promise<CategoryRow | null> {
  const categories = await fetchCategories(supabase);
  return categories.find((c) => getCategorySlug(c, locale) === slug) ?? null;
}

/**
 * Distinct cities that currently have at least one active listing, grouped by
 * slug. The canonical display name is the most frequent raw spelling.
 */
export async function getCityHubs(
  supabase: SupabaseClient
): Promise<CityHub[]> {
  const { data } = await supabase
    .from("listings")
    .select("city")
    .eq("status", "active")
    .not("city", "is", null);

  const groups = new Map<
    string,
    { count: number; spellings: Map<string, number> }
  >();

  for (const row of (data ?? []) as { city: string | null }[]) {
    const raw = row.city?.trim();
    if (!raw) continue;
    const slug = slugify(raw);
    if (!slug) continue;
    const group = groups.get(slug) ?? { count: 0, spellings: new Map() };
    group.count += 1;
    group.spellings.set(raw, (group.spellings.get(raw) ?? 0) + 1);
    groups.set(slug, group);
  }

  const hubs: CityHub[] = [];
  for (const [slug, group] of groups) {
    let name = slug;
    let best = -1;
    for (const [spelling, freq] of group.spellings) {
      if (freq > best) {
        best = freq;
        name = spelling;
      }
    }
    hubs.push({ slug, name, count: group.count });
  }

  hubs.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return hubs;
}

export async function resolveCityBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<CityHub | null> {
  const hubs = await getCityHubs(supabase);
  return hubs.find((h) => h.slug === slug) ?? null;
}

export type HubListingQuery = {
  categoryId?: string;
  city?: string;
  page: number;
};

/** Fetch a paginated set of active listings for a hub, with an exact count. */
export async function queryHubListings(
  supabase: SupabaseClient,
  { categoryId, city, page }: HubListingQuery
): Promise<{ listings: HubListing[]; count: number }> {
  const from = (page - 1) * HUB_PAGE_SIZE;
  const to = from + HUB_PAGE_SIZE - 1;

  let query = supabase
    .from("listings")
    .select(HUB_LISTING_SELECT, { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (city) query = query.ilike("city", escapeLike(city));

  const { data, count } = await query.range(from, to);
  return { listings: (data ?? []) as HubListing[], count: count ?? 0 };
}

/** Distinct (category, city) pairs that currently have active listings. */
export async function getCategoryCityHubs(
  supabase: SupabaseClient
): Promise<{ categoryId: string; citySlug: string; cityName: string; count: number }[]> {
  const { data } = await supabase
    .from("listings")
    .select("category_id, city")
    .eq("status", "active")
    .not("city", "is", null)
    .not("category_id", "is", null);

  const groups = new Map<
    string,
    { categoryId: string; citySlug: string; spellings: Map<string, number>; count: number }
  >();

  for (const row of (data ?? []) as { category_id: string | null; city: string | null }[]) {
    const raw = row.city?.trim();
    const categoryId = row.category_id;
    if (!raw || !categoryId) continue;
    const citySlug = slugify(raw);
    if (!citySlug) continue;
    const key = `${categoryId}::${citySlug}`;
    const group =
      groups.get(key) ?? { categoryId, citySlug, spellings: new Map(), count: 0 };
    group.count += 1;
    group.spellings.set(raw, (group.spellings.get(raw) ?? 0) + 1);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => {
    let cityName = group.citySlug;
    let best = -1;
    for (const [spelling, freq] of group.spellings) {
      if (freq > best) {
        best = freq;
        cityName = spelling;
      }
    }
    return {
      categoryId: group.categoryId,
      citySlug: group.citySlug,
      cityName,
      count: group.count,
    };
  });
}
