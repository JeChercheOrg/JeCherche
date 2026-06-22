import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import EditListingForm from "./edit-listing-form";

function getCategoryName(
  category: {
    name: string;
    name_fr: string | null;
    name_es: string | null;
    name_de: string | null;
  },
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, category_id, user_id, listing_images(id, storage_path, position)"
    )
    .eq("id", id)
    .single();

  if (!listing || listing.user_id !== user.id) {
    notFound();
  }

  const t = await getTranslations("MyListings");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_fr, name_es, name_de")
    .order("name");

  const localizedCategories = (categories || []).map((cat) => ({
    id: cat.id,
    name: getCategoryName(cat, locale),
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {t("editPageTitle")}
      </h1>
      <EditListingForm
        locale={locale}
        listing={listing}
        categories={localizedCategories}
      />
    </div>
  );
}
