import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Truck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/image-gallery";
import { UserAvatar } from "@/components/user-avatar";
import { ResponseForm } from "@/components/response-form";
import { ResponseCard } from "@/components/response-card";
import { ListingActions } from "@/components/listing-actions";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = await createClient();
  const t = await getTranslations({ locale, namespace: "SEO" });

  const { data: listing } = await supabase
    .from("listings")
    .select("title, description, price, listing_images(storage_path, position)")
    .eq("id", id)
    .single();

  if (!listing) return { title: "Not found" };

  const description = t("listingDetailDescription", {
    title: listing.title,
    price: `${(listing.price / 100).toFixed(0)}€`,
    description: (listing.description || "").slice(0, 120),
  });

  const firstImage = listing.listing_images?.sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  )[0];
  const ogImage = firstImage
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${firstImage.storage_path}`
    : undefined;

  return {
    title: listing.title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/listings/${id}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${SITE_URL}/${l}/listings/${id}`])
      ),
    },
    openGraph: {
      title: listing.title,
      description,
      url: `${SITE_URL}/${locale}/listings/${id}`,
      type: "article",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
  };
}

function getCategoryName(
  category: { name: string; name_fr: string | null; name_es: string | null; name_de: string | null },
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ListingDetail");
  const tR = await getTranslations("Responses");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position)")
    .eq("id", id)
    .single();

  if (!listing) {
    notFound();
  }

  const { data: author } = await supabase
    .from("profiles")
    .select("display_name, avatar_path")
    .eq("id", listing.user_id)
    .single();

  const authorName = author?.display_name || t("postedBy");
  const authorAvatarUrl = author?.avatar_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${author.avatar_path}`
    : null;

  const images = listing.listing_images || [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: responses } = await supabase
    .from("responses")
    .select("*, profiles:responses_user_id_profiles_fkey(display_name, avatar_path), response_images(storage_path, position)")
    .eq("listing_id", id)
    .order("price", { ascending: true });

  const isOwner = user?.id === listing.user_id;

  let hasResponded = false;
  if (user && !isOwner) {
    const { data: existingResponse } = await supabase
      .from("responses")
      .select("id")
      .eq("listing_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasResponded = !!existingResponse;
  }

  const canRespond = !!user && !isOwner && !hasResponded && listing.status !== "found";

  const responseTranslations = {
    yourOffer: tR("yourOffer"),
    offeredPrice: tR("offeredPrice"),
    statusPending: tR("statusPending"),
    statusAccepted: tR("statusAccepted"),
    statusRejected: tR("statusRejected"),
  };

  const formatResponseDate = (dateStr: string) =>
    format.dateTime(new Date(dateStr), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WantAction",
          name: listing.title,
          description: listing.description || undefined,
          agent: { "@type": "Person", name: authorName },
          object: {
            "@type": "Product",
            name: listing.title,
            offers: {
              "@type": "Demand",
              priceCurrency: "EUR",
              price: (listing.price / 100).toFixed(2),
            },
          },
          ...(listing.city && {
            location: { "@type": "Place", address: listing.city },
          }),
        }}
      />

      <Breadcrumbs
        locale={locale}
        items={[
          { label: t("backToListings"), href: "/listings" },
          { label: listing.title },
        ]}
      />

      <div className="mt-4 lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Left column — gallery + responses */}
        <div className="lg:col-span-3 mb-6 lg:mb-0 space-y-10">
          <ImageGallery
            images={images}
            alt={listing.title}
            supabaseUrl={supabaseUrl}
          />

          {/* Responses section */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {tR("sectionTitle")}
              {responses && responses.length > 0 && (
                <span className="ml-1.5 text-text-tertiary font-normal">
                  ({responses.length})
                </span>
              )}
            </h2>

            {canRespond && (
              <div className="mb-8">
                <ResponseForm locale={locale} listingId={id} listingPrice={listing.price} />
              </div>
            )}

            {user && isOwner && (
              <p className="text-sm text-text-tertiary italic mb-6">
                {tR("ownListing")}
              </p>
            )}

            {!responses || responses.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-8">
                {tR("noResponses")}
              </p>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <ResponseCard
                    key={response.id}
                    response={response}
                    locale={locale}
                    listingId={id}
                    listingPrice={listing.price}
                    formatPrice={formatPrice}
                    formatDate={formatResponseDate}
                    supabaseUrl={supabaseUrl}
                    isOwn={response.user_id === user?.id}
                    isListingOwner={isOwner}
                    translations={responseTranslations}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — sticky info card */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4 lg:sticky lg:top-20">
            {listing.categories && (
              <Badge variant="secondary">
                {getCategoryName(listing.categories, locale)}
              </Badge>
            )}

            {listing.status === "found" && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm font-medium text-green-800">
                  {t("listingFound")}
                </p>
              </div>
            )}

            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              {listing.title}
            </h1>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary-text">
                {format.number(listing.price / 100, {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
              <span className="text-xs text-text-tertiary uppercase tracking-wide">
                {t("budget")}
              </span>
            </div>

            <p className="text-sm text-text-tertiary">
              {t("postedOn")}{" "}
              <time dateTime={listing.created_at}>
                {format.dateTime(new Date(listing.created_at), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </p>

            {(listing.city || listing.delivery_available) && (
              <div className="flex flex-wrap items-center gap-2">
                {listing.city && (
                  <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.city} {listing.postal_code}
                  </span>
                )}
                {listing.delivery_available && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary-text">
                    <Truck className="h-3 w-3" />
                    {t("deliveryAvailable")}
                  </span>
                )}
              </div>
            )}

            <hr className="border-border" />

            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-2">
                {t("description")}
              </h2>
              {listing.description ? (
                <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              ) : (
                <p className="text-sm text-text-tertiary italic">
                  {t("noDescription")}
                </p>
              )}
            </div>

            <hr className="border-border" />

            <Link
              href={`/${locale}/users/${listing.user_id}`}
              className="flex items-center gap-3 group"
            >
              <UserAvatar
                displayName={authorName}
                avatarUrl={authorAvatarUrl}
                size="md"
              />
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:underline">
                  {authorName}
                </p>
                <p className="text-xs text-text-tertiary">
                  {t("viewProfile")}
                </p>
              </div>
            </Link>

            {canRespond && (
              <>
                <hr className="border-border" />
                <ListingActions locale={locale} listingId={id} />
              </>
            )}

            {!user && listing.status !== "found" && (
              <>
                <hr className="border-border" />
                <Link
                  href={`/${locale}/login?redirectTo=/${locale}/listings/${id}`}
                  className="block rounded-lg border border-primary/30 bg-primary-light/30 px-4 py-3 text-center hover:bg-primary-light/50 transition-colors"
                >
                  <p className="text-sm font-medium text-primary-text">
                    {tR("loginToOffer")}
                  </p>
                </Link>
              </>
            )}

            {user && hasResponded && (
              <>
                <hr className="border-border" />
                <div className="rounded-lg border border-primary/30 bg-primary-light/30 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-primary-text">
                    {tR("alreadyResponded")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
