import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Megaphone, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getFavoriteIds } from "@/app/actions/favorites";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/constants";
import { HUB_PAGE_SIZE, type HubListing } from "@/lib/hubs";

export type HubLinkSection = {
  title: string;
  links: { label: string; href: string }[];
};

interface HubViewProps {
  locale: string;
  breadcrumbItems: { label: string; href?: string }[];
  heading: string;
  intro: string;
  sellerCta: string;
  listings: HubListing[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  /** Path without locale prefix, e.g. "/recherche/velos". */
  basePath: string;
  emptyText: string;
  relatedSections?: HubLinkSection[];
  faq?: { question: string; answer: string }[];
}

export async function HubView({
  locale,
  breadcrumbItems,
  heading,
  intro,
  sellerCta,
  listings,
  totalCount,
  currentPage,
  totalPages,
  basePath,
  emptyText,
  relatedSections = [],
  faq = [],
}: HubViewProps) {
  const t = await getTranslations("Hub");
  const tL = await getTranslations("Listings");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const listingIds = listings.map((l) => l.id);
  const favoritedIds = user ? await getFavoriteIds(listingIds) : [];

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });
  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {listings.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            numberOfItems: totalCount,
            itemListElement: listings.slice(0, 10).map((listing, index) => ({
              "@type": "ListItem",
              position: (currentPage - 1) * HUB_PAGE_SIZE + index + 1,
              url: `${SITE_URL}/${locale}/listings/${listing.id}`,
              name: listing.title,
            })),
          }}
        />
      )}
      {faq.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      )}

      <div className="mb-4">
        <Breadcrumbs items={breadcrumbItems} locale={locale} />
      </div>

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {heading}
        </h1>
        <p className="text-text-secondary max-w-2xl">{intro}</p>
      </header>

      <section
        aria-label={t("sellerBoxTitle")}
        className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-primary-light/40 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light">
            <Megaphone className="h-4 w-4 text-primary-text" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">
              {t("sellerBoxTitle")}
            </p>
            <p className="text-sm text-text-secondary">{sellerCta}</p>
          </div>
        </div>
        <Link href={`/${locale}/signup`} className="shrink-0">
          <Button>{t("sellerBoxCta")}</Button>
        </Link>
      </section>

      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-text-secondary mb-4">{emptyText}</p>
          <Link href={`/${locale}/listings/create`}>
            <Button>{t("publishCta")}</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                formatPrice={formatPrice}
                formatDate={formatDate}
                priceTbdLabel={tL("priceTbd")}
                foundLabel={tL("found")}
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
              searchParams={{}}
              basePath={basePath}
              translations={{
                previous: tL("previous"),
                next: tL("next"),
                pageInfo: tL("pageInfo", { page: currentPage, total: totalPages }),
                pageLabel: tL("pageLabel"),
              }}
            />
          )}
        </>
      )}

      {relatedSections.some((s) => s.links.length > 0) && (
        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {relatedSections
            .filter((section) => section.links.length > 0)
            .map((section) => (
              <nav key={section.title} aria-label={section.title}>
                <h2 className="mb-3 text-sm font-semibold text-text-primary">
                  {section.title}
                </h2>
                <ul className="space-y-1.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-text hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
        </div>
      )}

      {faq.length > 0 && (
        <section className="mt-12 border-t border-border pt-8" aria-labelledby="hub-faq">
          <h2 id="hub-faq" className="mb-4 text-lg font-semibold text-text-primary">
            {t("faqTitle")}
          </h2>
          <dl className="space-y-4 max-w-2xl">
            {faq.map((item) => (
              <div key={item.question}>
                <dt className="font-medium text-text-primary">{item.question}</dt>
                <dd className="mt-1 text-sm text-text-secondary">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-10 text-center">
        <Link
          href={`/${locale}/listings`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-text hover:underline"
        >
          {t("viewAllListings")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
