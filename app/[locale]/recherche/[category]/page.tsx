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
  getCategorySlug,
  getCategorySlugsByLocale,
  getLocalizedCategoryName,
  queryHubListings,
  getCityHubs,
  getCategoryCityHubs,
} from "@/lib/hubs";

type Params = Promise<{ locale: string; category: string }>;
type Search = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, category: slug } = await params;
  if (slug === CITY_SEGMENT) return {};

  const supabase = await createClient();
  const category = await resolveCategoryBySlug(supabase, slug, locale);
  if (!category) return {};

  const t = await getTranslations({ locale, namespace: "SEO" });
  const name = getLocalizedCategoryName(category, locale);
  const slugs = getCategorySlugsByLocale(category);

  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("category_id", category.id)
    .eq("status", "active");

  const title = t("categoryHubTitle", { category: name });
  const description = t("categoryHubDescription", { category: name });

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/recherche/${slug}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${SITE_URL}/${l}/recherche/${slugs[l as HubLocale]}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/recherche/${slug}`,
      type: "website",
    },
    robots: (count ?? 0) > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function CategoryHubPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { locale, category: slug } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);

  if (slug === CITY_SEGMENT) notFound();

  const supabase = await createClient();
  const category = await resolveCategoryBySlug(supabase, slug, locale);
  if (!category) notFound();

  const currentPage = Math.max(1, parseInt(page || "1") || 1);
  const name = getLocalizedCategoryName(category, locale);

  const { listings, count } = await queryHubListings(supabase, {
    categoryId: category.id,
    page: currentPage,
  });
  const totalPages = Math.max(1, Math.ceil(count / HUB_PAGE_SIZE));

  const t = await getTranslations("Hub");

  const [categories, cityHubs, catCityHubs] = await Promise.all([
    fetchCategories(supabase),
    getCityHubs(supabase),
    getCategoryCityHubs(supabase),
  ]);

  const otherCategories = categories
    .filter((c) => c.id !== category.id)
    .slice(0, 12)
    .map((c) => ({
      label: getLocalizedCategoryName(c, locale),
      href: `/${locale}/recherche/${getCategorySlug(c, locale)}`,
    }));

  const categoryInCities = catCityHubs
    .filter((h) => h.categoryId === category.id)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((h) => ({
      label: `${name} · ${h.cityName}`,
      href: `/${locale}/recherche/${slug}/${h.citySlug}`,
    }));

  const popularCities = cityHubs.slice(0, 12).map((c) => ({
    label: c.name,
    href: `/${locale}/recherche/villes/${c.slug}`,
  }));

  const relatedSections: HubLinkSection[] = [
    { title: t("otherCategoriesTitle"), links: otherCategories },
    { title: t("categoryInCitiesTitle", { category: name }), links: categoryInCities },
    { title: t("popularCitiesTitle"), links: popularCities },
  ];

  const faq = [
    {
      question: t("categoryFaqQ1", { category: name }),
      answer: t("categoryFaqA1", { category: name }),
    },
    { question: t("faqQ2"), answer: t("faqA2") },
  ];

  return (
    <HubView
      locale={locale}
      breadcrumbItems={[
        { label: "VendsMoi", href: "" },
        { label: t("breadcrumbSearch"), href: "/recherche" },
        { label: name },
      ]}
      heading={t("categoryHeading", { category: name })}
      intro={t("categoryIntro", { count, category: name })}
      sellerCta={t("categorySeller", { category: name })}
      listings={listings}
      totalCount={count}
      currentPage={currentPage}
      totalPages={totalPages}
      basePath={`/recherche/${slug}`}
      emptyText={t("categoryEmpty", { category: name })}
      relatedSections={relatedSections}
      faq={faq}
    />
  );
}
