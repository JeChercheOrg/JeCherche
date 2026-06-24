import { createClient } from "@/utils/supabase/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { MyListingCard } from "@/components/my-listing-card";

export default async function MyListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("MyListings");

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position), responses(count)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {t("pageTitle")}
      </h1>

      {!listings || listings.length === 0 ? (
        <p className="text-text-secondary text-center py-16">
          {t("noListings")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              translations={{
                edit: t("edit"),
                delete: t("delete"),
                confirmDelete: t("confirmDelete"),
                cancelDelete: t("cancelDelete"),
                deleting: t("deleting"),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
