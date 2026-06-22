import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/image-gallery";
import { UserAvatar } from "@/components/user-avatar";

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
        {/* Gallery — left 60% */}
        <div className="lg:col-span-3 mb-6 lg:mb-0">
          <ImageGallery
            images={images}
            alt={listing.title}
            supabaseUrl={supabaseUrl}
          />
        </div>

        {/* Info — right 40% */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
