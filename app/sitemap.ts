import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { SITE_URL } from "@/lib/constants";
import {
  fetchCategories,
  getCityHubs,
  getCategoryCityHubs,
  getCategorySlug,
} from "@/lib/hubs";

const locales = ["fr", "en", "es", "de"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, updated_at")
    .order("updated_at", { ascending: false });

  const legalSlugs = ["mentions-legales", "confidentialite", "cgu", "cookies"];

  const staticPages = locales.flatMap((locale) => [
    {
      url: `${SITE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/${locale}/listings`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/${locale}/recherche`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    ...legalSlugs.map((slug) => ({
      url: `${SITE_URL}/${locale}/legal/${slug}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ]);

  const listingPages = (listings ?? []).flatMap((listing) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/listings/${listing.id}`,
      lastModified: new Date(listing.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  // Programmatic SEO hubs — only for combinations that currently have content.
  const [categories, cityHubs, catCityHubs] = await Promise.all([
    fetchCategories(supabase),
    getCityHubs(supabase),
    getCategoryCityHubs(supabase),
  ]);
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const { data: activeByCategory } = await supabase
    .from("listings")
    .select("category_id")
    .eq("status", "active")
    .not("category_id", "is", null);
  const activeCategoryIds = new Set(
    (activeByCategory ?? []).map(
      (r) => (r as { category_id: string }).category_id
    )
  );

  const categoryPages = categories
    .filter((category) => activeCategoryIds.has(category.id))
    .flatMap((category) =>
      locales.map((locale) => ({
        url: `${SITE_URL}/${locale}/recherche/${getCategorySlug(category, locale)}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.6,
      }))
    );

  const cityPages = cityHubs.flatMap((city) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/recherche/villes/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    }))
  );

  const categoryCityPages = catCityHubs.flatMap((hub) => {
    const category = categoriesById.get(hub.categoryId);
    if (!category) return [];
    return locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/recherche/${getCategorySlug(category, locale)}/${hub.citySlug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    }));
  });

  return [
    ...staticPages,
    ...listingPages,
    ...categoryPages,
    ...cityPages,
    ...categoryCityPages,
  ];
}
