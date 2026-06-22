import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { ListingCard } from "@/components/listing-card";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("PublicProfile");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_path, created_at")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  const displayName = profile.display_name || t("anonymousUser");
  const avatarUrl = profile.avatar_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_path}`
    : null;

  const { data: listings } = await supabase
    .from("listings")
    .select("*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short" });

  const memberSinceDate = format.dateTime(new Date(profile.created_at), {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-5 mb-8">
        <UserAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          size="lg"
        />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {displayName}
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {t("memberSince", { date: memberSinceDate })}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4">
        {t("listings")}
        {listings && listings.length > 0 && (
          <span className="ml-1.5 text-text-tertiary font-normal">({listings.length})</span>
        )}
      </h2>

      {!listings || listings.length === 0 ? (
        <p className="text-text-secondary text-center py-16">
          {t("noListings")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </div>
  );
}
