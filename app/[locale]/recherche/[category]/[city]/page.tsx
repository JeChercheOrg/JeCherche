import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { HubView, type HubLinkSection } from "@/components/hub-view";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";
import {
  HUB_PAGE_SIZE,
  CITY_SEGMENT,
  type HubLocale,
  fetchCategories,
  resolveCategoryBySlug,
  resolveCityBySlug,
  getCityHubs,
  getCategorySlug,
  getCategorySlugsByLocale,
  getLocalizedCategoryName,
  queryHubListings,
  getCategoryCityHubs,
} from "@/lib/hubs";

type Params = Promise<{ locale: string; category: string; city: string }>;
type Search = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, category: categorySlug, city: citySlug } = await params;
  if (categorySlug === CITY_SEGMENT) return {};

  const supabase = await createClient();
  const [category, city] = await Promise.all([
    resolveCategoryBySlug(supabase, categorySlug, locale),
    resolveCityBySlug(supabase, citySlug),
  ]);
  if (!category || !city) return {};

  const t = await getTranslations({ locale, namespace: "SEO" });
  const name = getLocalizedCategoryName(category, locale);
  const slugs = getCategorySlugsByLocale(category);

  const title = t("categoryCityHubTitle", { category: name, city: city.name });
  const description = t("categoryCityHubDescription", {
    category: name,
    city: city.name,
  });

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/recherche/${categorySlug}/${citySlug}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${SITE_URL}/${l}/recherche/${slugs[l as HubLocale]}/${citySlug}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/recherche/${categorySlug}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function CategoryCityHubPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { locale, category: categorySlug, city: citySlug } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);

  if (categorySlug === CITY_SEGMENT) notFound();

  const supabase = await createClient();
  const [category, city] = await Promise.all([
    resolveCategoryBySlug(supabase, categorySlug, locale),
    resolveCityBySlug(supabase, citySlug),
  ]);
  if (!category || !city) notFound();

  const currentPage = Math.max(1, parseInt(page || "1") || 1);
  const name = getLocalizedCategoryName(category, locale);

  const { listings, count } = await queryHubListings(supabase, {
    categoryId: category.id,
    city: city.name,
    page: currentPage,
  });

  // A category x city hub only exists if it currently has active listings.
  if (count === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(count / HUB_PAGE_SIZE));

  const t = await getTranslations("Hub");

  const [categories, cityHubs, catCityHubs] = await Promise.all([
    fetchCategories(supabase),
    getCityHubs(supabase),
    getCategoryCityHubs(supabase),
  ]);
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const sameCityCategories = catCityHubs
    .filter(
      (h) =>
        h.citySlug === citySlug &&
        h.categoryId !== category.id &&
        categoriesById.has(h.categoryId)
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((h) => {
      const c = categoriesById.get(h.categoryId)!;
      return {
        label: `${getLocalizedCategoryName(c, locale)} · ${city.name}`,
        href: `/${locale}/recherche/${getCategorySlug(c, locale)}/${citySlug}`,
      };
    });

  const sameCategoryCities = catCityHubs
    .filter((h) => h.categoryId === category.id && h.citySlug !== citySlug)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((h) => ({
      label: `${name} · ${h.cityName}`,
      href: `/${locale}/recherche/${categorySlug}/${h.citySlug}`,
    }));

  const otherCities = cityHubs
    .filter((c) => c.slug !== citySlug)
    .slice(0, 12)
    .map((c) => ({
      label: c.name,
      href: `/${locale}/recherche/villes/${c.slug}`,
    }));

  const relatedSections: HubLinkSection[] = [
    {
      title: t("categoriesInCityTitle", { city: city.name }),
      links: sameCityCategories,
    },
    {
      title: t("categoryInCitiesTitle", { category: name }),
      links: sameCategoryCities,
    },
    { title: t("popularCitiesTitle"), links: otherCities },
  ];

  const faq = [
    {
      question: t("categoryCityFaqQ1", { category: name, city: city.name }),
      answer: t("categoryCityFaqA1", { category: name, city: city.name }),
    },
    { question: t("faqQ2"), answer: t("faqA2") },
  ];

  return (
    <HubView
      locale={locale}
      breadcrumbItems={[
        { label: "VendsMoi", href: "" },
        { label: t("breadcrumbSearch"), href: "/recherche" },
        {
          label: name,
          href: `/recherche/${categorySlug}`,
        },
        { label: city.name },
      ]}
      heading={t("categoryCityHeading", { category: name, city: city.name })}
      intro={t("categoryCityIntro", { count, category: name, city: city.name })}
      sellerCta={t("categoryCitySeller", { category: name, city: city.name })}
      listings={listings}
      totalCount={count}
      currentPage={currentPage}
      totalPages={totalPages}
      basePath={`/recherche/${categorySlug}/${citySlug}`}
      emptyText={t("categoryCityEmpty", { category: name, city: city.name })}
      relatedSections={relatedSections}
      faq={faq}
    />
  );
}
