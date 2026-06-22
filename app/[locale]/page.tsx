import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/hero-section";
import { CategoryBar } from "@/components/category-bar";
import { ListingCard } from "@/components/listing-card";
import { X } from "lucide-react";

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { locale } = await params;
  const { q, category } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const format = await getFormatter();
  const supabase = await createClient();

  const searchQuery = q?.trim() || "";
  const hasFilters = searchQuery.length > 0 || !!category;

  let query = supabase
    .from("listings")
    .select("*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position)")
    .order("created_at", { ascending: false });

  if (searchQuery) {
    const escaped = searchQuery.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.ilike("title", `%${escaped}%`);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  const { data: listings } = await query;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_fr, name_es, name_de")
    .order("name");

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short" });

  return (
    <>
      {!hasFilters && (
        <HeroSection
          locale={locale}
          translations={{
            title: t("heroTitle"),
            subtitle: t("heroSubtitle"),
            cta: t("heroCta"),
          }}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-6">
        {categories && (
          <CategoryBar
            categories={categories}
            locale={locale}
            currentCategory={category}
            currentQuery={searchQuery}
            allLabel={t("allCategories")}
          />
        )}

        <section className="mt-6">
          {hasFilters ? (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {searchQuery
                  ? t("searchResults", { query: searchQuery })
                  : t("title")}
              </h2>
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                {t("clearFilters")}
              </Link>
            </div>
          ) : (
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {t("title")}
            </h2>
          )}

          {!listings || listings.length === 0 ? (
            <p className="text-text-secondary text-center py-16">
              {hasFilters ? t("noResults") : t("noListings")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  locale={locale}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
