import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";
import {
  fetchCategories,
  getCityHubs,
  getCategorySlug,
  getLocalizedCategoryName,
} from "@/lib/hubs";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });
  const title = t("searchHubTitle");
  const description = t("searchHubDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/recherche`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${SITE_URL}/${l}/recherche`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/recherche`,
      type: "website",
    },
  };
}

export default async function SearchHubIndexPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Hub");
  const supabase = await createClient();

  const categories = await fetchCategories(supabase);
  const cities = (await getCityHubs(supabase)).slice(0, 30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: "VendsMoi", href: "" },
            { label: t("breadcrumbSearch") },
          ]}
          locale={locale}
        />
      </div>

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {t("indexHeading")}
        </h1>
        <p className="text-text-secondary max-w-2xl">{t("indexIntro")}</p>
      </header>

      <section className="mb-10" aria-labelledby="hub-categories">
        <h2
          id="hub-categories"
          className="mb-3 text-lg font-semibold text-text-primary"
        >
          {t("indexCategoriesTitle")}
        </h2>
        {categories.length === 0 ? (
          <p className="text-text-secondary">{t("indexEmpty")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/recherche/${getCategorySlug(category, locale)}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-primary-text"
              >
                {getLocalizedCategoryName(category, locale)}
              </Link>
            ))}
          </div>
        )}
      </section>

      {cities.length > 0 && (
        <section aria-labelledby="hub-cities">
          <h2
            id="hub-cities"
            className="mb-3 text-lg font-semibold text-text-primary"
          >
            {t("indexCitiesTitle")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/${locale}/recherche/villes/${city.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-primary-text"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
