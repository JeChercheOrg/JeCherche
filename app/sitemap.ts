import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { SITE_URL } from "@/lib/constants";

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

  return [...staticPages, ...listingPages];
}
