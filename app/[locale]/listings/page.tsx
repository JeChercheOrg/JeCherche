import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { SearchBar } from "@/components/search-bar";
import { CategoryBar } from "@/components/category-bar";
import { ListingsFilters } from "@/components/listings-filters";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { JsonLd } from "@/components/json-ld";
import { X } from "lucide-react";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";
import { getFavoriteIds } from "@/app/actions/favorites";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q, page } = await searchParams;
  const t = await getTranslations({ locale, namespace: "SEO" });
  const tL = await getTranslations({ locale, namespace: "Listings" });

  const pageNum = Math.max(1, parseInt(page || "1") || 1);
  const baseTitle = q ? tL("searchResults", { query: q }) : t("listingsTitle");
  const title = pageNum > 1 ? tL("titlePaged", { title: baseTitle, page: pageNum }) : baseTitle;
  const description = t("listingsDescription");
  const pageSuffix = pageNum > 1 ? `?page=${pageNum}` : "";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/listings${pageSuffix}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${SITE_URL}/${l}/listings${pageSuffix}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/listings${pageSuffix}`,
      type: "website",
    },
  };
}

const PAGE_SIZE = 24;

export default async function ListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    price_min?: string;
    price_max?: string;
    sort?: string;
    city?: string;
    delivery?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    show_found?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  const { q, category, price_min, price_max, sort, city, delivery, lat, lng, radius, show_found, page } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Listings");
  const format = await getFormatter();
  const supabase = await createClient();

  const searchQuery = q?.trim() || "";
  const priceMin = price_min ? parseInt(price_min) * 100 : null;
  const priceMax = price_max ? parseInt(price_max) * 100 : null;
  const sortBy = sort || "newest";
  const currentPage = Math.max(1, parseInt(page || "1") || 1);

  const orderColumn = sortBy === "cheapest" || sortBy === "expensive" ? "price" : "created_at";
  const orderAscending = sortBy === "oldest" || sortBy === "cheapest";

  let query = supabase
    .from("listings")
    .select("*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position), responses(count)", { count: "exact" })
    .order(orderColumn, { ascending: orderAscending })
    .order("id", { ascending: true });

  if (show_found !== "true") {
    query = query.eq("status", "active");
  }

  if (searchQuery) {
    const escaped = searchQuery.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (priceMin !== null) {
    query = query.gte("price", priceMin);
  }

  if (priceMax !== null) {
    query = query.lte("price", priceMax);
  }

  if (city) {
    const centerLat = lat ? parseFloat(lat) : null;
    const centerLng = lng ? parseFloat(lng) : null;
    const radiusKm = radius ? parseInt(radius) : null;

    if (centerLat && centerLng && radiusKm) {
      const { data: nearbyIds } = await supabase.rpc("listings_within_radius", {
        center_lat: centerLat,
        center_lng: centerLng,
        radius_km: radiusKm,
      });
      if (nearbyIds && nearbyIds.length > 0) {
        query = query.in("id", nearbyIds.map((r: { id: string }) => r.id));
      } else {
        query = query.in("id", []);
      }
    } else {
      query = query.ilike("city", `%${city}%`);
    }
  }

  if (delivery === "true") {
    query = query.eq("delivery_available", true);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: listings, count: totalCount } = await query.range(from, to);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const listingIds = listings?.map((l) => l.id) ?? [];
  const favoritedIds = user ? await getFavoriteIds(listingIds) : [];

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_fr, name_es, name_de")
    .order("name");

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short" });

  const hasFilters = searchQuery.length > 0 || !!category || priceMin !== null || priceMax !== null || !!city || delivery === "true" || !!radius || show_found === "true";
  const count = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {listings && listings.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            numberOfItems: count,
            itemListElement: listings.slice(0, 10).map((listing, index) => ({
              "@type": "ListItem",
              position: from + index + 1,
              url: `${SITE_URL}/${locale}/listings/${listing.id}`,
              name: listing.title,
            })),
          }}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {searchQuery ? t("searchResults", { query: searchQuery }) : t("title")}
        </h1>
        {hasFilters && (
          <Link
            href={`/${locale}/listings`}
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            {t("clearFilters")}
          </Link>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <Suspense fallback={null}>
          <SearchBar
            placeholder={t("title")}
            action={`/${locale}/listings`}
          />
        </Suspense>

        {categories && (
          <CategoryBar
            categories={categories}
            locale={locale}
            currentCategory={category}
            currentQuery={searchQuery}
            allLabel={t("allCategories")}
            basePath={`/${locale}/listings`}
          />
        )}

        <Suspense fallback={null}>
          <ListingsFilters
            locale={locale}
            translations={{
              priceMin: t("priceMin"),
              priceMax: t("priceMax"),
              sortLabel: t("sortLabel"),
              sortNewest: t("sortNewest"),
              sortOldest: t("sortOldest"),
              sortCheapest: t("sortCheapest"),
              sortExpensive: t("sortExpensive"),
              cityFilter: t("cityFilter"),
              deliveryFilter: t("deliveryFilter"),
              radiusLabel: t("radiusLabel"),
              showFound: t("showFound"),
              cityNoResult: t("cityNoResult"),
            }}
          />
        </Suspense>
      </div>

      <p className="text-sm text-text-tertiary mb-4">
        {t("resultsCount", { count })}
      </p>

      {count === 0 ? (
        <p className="text-text-secondary text-center py-16">
          {t("noResults")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings!.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                formatPrice={formatPrice}
                formatDate={formatDate}
                foundLabel={t("found")}
                priceTbdLabel={t("priceTbd")}
                isFavorited={favoritedIds.includes(listing.id)}
                isAuthenticated={!!user}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              locale={locale}
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={{ q, category, price_min, price_max, sort, city, delivery, lat, lng, radius, show_found }}
              translations={{
                previous: t("previous"),
                next: t("next"),
                pageInfo: t("pageInfo", { page: currentPage, total: totalPages }),
                pageLabel: t("pageLabel"),
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
