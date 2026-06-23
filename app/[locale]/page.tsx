import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/hero-section";
import { ListingCard } from "@/components/listing-card";
import { ArrowRight } from "lucide-react";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position)")
    .order("created_at", { ascending: false })
    .limit(6);

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short" });

  return (
    <>
      <HeroSection
        locale={locale}
        translations={{
          title: t("heroTitle"),
          subtitle: t("heroSubtitle"),
          cta: t("heroCta"),
          viewAll: t("viewAll"),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("title")}
            </h2>
            <Link
              href={`/${locale}/listings`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-text hover:underline"
            >
              {t("viewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!listings || listings.length === 0 ? (
            <p className="text-text-secondary text-center py-16">
              {t("noListings")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
