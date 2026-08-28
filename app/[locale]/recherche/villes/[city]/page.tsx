import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { HubView, type HubLinkSection } from "@/components/hub-view";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";
import {
  HUB_PAGE_SIZE,
  fetchCategories,
  resolveCityBySlug,
  getCityHubs,
  getCategorySlug,
  getLocalizedCategoryName,
  queryHubListings,
  getCategoryCityHubs,
} from "@/lib/hubs";

type Params = Promise<{ locale: string; city: string }>;
type Search = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, city: slug } = await params;

  const supabase = await createClient();
  const city = await resolveCityBySlug(supabase, slug);
  if (!city) return {};

  const t = await getTranslations({ locale, namespace: "SEO" });
  const title = t("cityHubTitle", { city: city.name });
  const description = t("cityHubDescription", { city: city.name });

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/recherche/villes/${slug}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${SITE_URL}/${l}/recherche/villes/${slug}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/recherche/villes/${slug}`,
      type: "website",
    },
  };
}

export default async function CityHubPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { locale, city: slug } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);

  const supabase = await createClient();
  const city = await resolveCityBySlug(supabase, slug);
  if (!city) notFound();

  const currentPage = Math.max(1, parseInt(page || "1") || 1);

  const { listings, count } = await queryHubListings(supabase, {
    city: city.name,
    page: currentPage,
  });
  const totalPages = Math.max(1, Math.ceil(count / HUB_PAGE_SIZE));

  const t = await getTranslations("Hub");

  const [categories, cityHubs, catCityHubs] = await Promise.all([
    fetchCategories(supabase),
    getCityHubs(supabase),
    getCategoryCityHubs(supabase),
  ]);

  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const categoriesInCity = catCityHubs
    .filter((h) => h.citySlug === slug && categoriesById.has(h.categoryId))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((h) => {
      const category = categoriesById.get(h.categoryId)!;
      return {
        label: `${getLocalizedCategoryName(category, locale)} · ${city.name}`,
        href: `/${locale}/recherche/${getCategorySlug(category, locale)}/${slug}`,
      };
    });

  const allCategories = categories.slice(0, 12).map((c) => ({
    label: getLocalizedCategoryName(c, locale),
    href: `/${locale}/recherche/${getCategorySlug(c, locale)}`,
  }));

  const otherCities = cityHubs
    .filter((c) => c.slug !== slug)
    .slice(0, 12)
    .map((c) => ({
      label: c.name,
      href: `/${locale}/recherche/villes/${c.slug}`,
    }));

  const relatedSections: HubLinkSection[] = [
    { title: t("categoriesInCityTitle", { city: city.name }), links: categoriesInCity },
    { title: t("otherCategoriesTitle"), links: allCategories },
    { title: t("popularCitiesTitle"), links: otherCities },
  ];

  const faq = [
    {
      question: t("cityFaqQ1", { city: city.name }),
      answer: t("cityFaqA1", { city: city.name }),
    },
    { question: t("faqQ2"), answer: t("faqA2") },
  ];

  return (
    <HubView
      locale={locale}
      breadcrumbItems={[
        { label: "VendsMoi", href: "" },
        { label: t("breadcrumbSearch"), href: "/recherche" },
        { label: city.name },
      ]}
      heading={t("cityHeading", { city: city.name })}
      intro={t("cityIntro", { count, city: city.name })}
      sellerCta={t("citySeller", { city: city.name })}
      listings={listings}
      totalCount={count}
      currentPage={currentPage}
      totalPages={totalPages}
      basePath={`/recherche/villes/${slug}`}
      emptyText={t("cityEmpty", { city: city.name })}
      relatedSections={relatedSections}
      faq={faq}
    />
  );
}
