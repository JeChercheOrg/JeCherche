import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/hero-section";
import { ListingCard } from "@/components/listing-card";
import { JsonLd } from "@/components/json-ld";
import { ArrowRight, Search, MessageSquare, CheckCircle } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${SITE_URL}/${l}`])
      ),
    },
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: `${SITE_URL}/${locale}`,
      type: "website",
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const tH = await getTranslations("HowItWorks");
  const tSeo = await getTranslations("SEO");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position), responses(count)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short" });

  const steps = [
    { icon: Search, title: tH("step1Title"), description: tH("step1Description") },
    { icon: MessageSquare, title: tH("step2Title"), description: tH("step2Description") },
    { icon: CheckCircle, title: tH("step3Title"), description: tH("step3Description") },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: `${SITE_URL}/${locale}`,
          description: tSeo("homeDescription"),
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/${locale}/listings?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

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
        <section aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-lg font-semibold text-text-primary mb-6 text-center">
            {tH("title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center p-4">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-text-primary mb-1">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="latest-listings">
          <div className="flex items-center justify-between mb-4">
            <h2 id="latest-listings" className="text-lg font-semibold text-text-primary">
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
