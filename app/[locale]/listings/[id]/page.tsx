import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/image-gallery";
import { UserAvatar } from "@/components/user-avatar";
import { ResponseForm } from "@/components/response-form";
import { ResponseCard } from "@/components/response-card";
import { ListingActions } from "@/components/listing-actions";

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

  const canRespond = !!user && !isOwner && !hasResponded;

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
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToListings")}
      </Link>

      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
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
              {format.dateTime(new Date(listing.created_at), {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

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

            {!user && (
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
