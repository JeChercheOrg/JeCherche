import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Favorites" });
  return {
    title: t("pageTitle"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/favorites`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${SITE_URL}/${l}/favorites`])
      ),
    },
  };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("Favorites");
  const tListings = await getTranslations("Listings");
  const format = await getFormatter();

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      "listing_id, created_at, listings(*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position), responses(count))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (favorites
    ?.map((f) => f.listings)
    .filter(Boolean) ?? []) as unknown as Array<{
    id: string;
    title: string;
    price: number;
    created_at: string;
    city?: string | null;
    postal_code?: string | null;
    status?: string;
    listing_images?: { storage_path: string; position: number }[];
    categories?: { name: string; name_fr: string | null; name_es: string | null; name_de: string | null } | null;
    responses?: { count: number }[];
  }>;

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {t("pageTitle")}
      </h1>

      {listings.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-text-secondary">{t("noFavorites")}</p>
          <p className="text-text-tertiary text-sm">{t("emptyState")}</p>
          <Link
            href={`/${locale}/listings`}
            className="inline-block mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            {t("browseCta")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              formatPrice={formatPrice}
              formatDate={formatDate}
              foundLabel={tListings("found")}
              priceTbdLabel={tListings("priceTbd")}
              isFavorited
              isAuthenticated
            />
          ))}
        </div>
      )}
    </div>
  );
}
