import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";

function getCategoryName(
  category: { name: string; name_fr: string | null; name_es: string | null; name_de: string | null },
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("*, categories(name, name_fr, name_es, name_de)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("title")}
      </h1>

      {!listings || listings.length === 0 ? (
        <p className="text-gray-500 text-center py-12">{t("noListings")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 mb-3">
                {listing.categories && getCategoryName(listing.categories, locale)}
              </span>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {listing.title}
              </h2>
              {listing.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {listing.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-bold text-green-700">
                  {format.number(listing.price / 100, {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
                <span className="text-xs text-gray-400">
                  {format.dateTime(new Date(listing.created_at), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
