import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import CreateListingForm from "./create-listing-form";

function getCategoryName(
  category: { name: string; name_fr: string | null; name_es: string | null; name_de: string | null },
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export default async function CreateListingPage({
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
      <CreateListingForm locale={locale} categories={localizedCategories} />
    </div>
  );
}
