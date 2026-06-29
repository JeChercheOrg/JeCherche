import { createClient } from "@/utils/supabase/server";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Pencil, MapPin, CheckCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminListingCard } from "./admin-listing-card";

function getCategoryName(
  category: { name: string; name_fr: string | null; name_es: string | null; name_de: string | null },
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { status, q } = await searchParams;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("Admin");
  const tMy = await getTranslations("MyListings");
  const format = await getFormatter();

  let query = supabase
    .from("listings")
    .select(
      "*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position), responses(count), profiles:listings_user_id_profiles_fkey(display_name)"
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: listings } = await query;

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short", year: "numeric" });

  const currentStatus = status || "all";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-amber-600" />
        <h1 className="text-2xl font-bold text-text-primary">
          {t("pageTitle")}
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form className="relative flex-1" action={`/${locale}/admin`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {status && status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
        </form>

        <div className="flex gap-2">
          {["all", "active", "found"].map((s) => (
            <Link
              key={s}
              href={`/${locale}/admin?status=${s}${q ? `&q=${q}` : ""}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${currentStatus === s
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-text-secondary hover:bg-background"
                }`}
            >
              {t(`status_${s}`)}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-sm text-text-tertiary mb-4">
        {t("totalListings", { count: listings?.length ?? 0 })}
      </p>

      {!listings || listings.length === 0 ? (
        <p className="text-text-secondary text-center py-16">
          {t("noListings")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => {
            const authorName =
              (listing.profiles as { display_name: string } | null)
                ?.display_name || t("unknownAuthor");
            return (
              <AdminListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                authorName={authorName}
                formatPrice={formatPrice}
                formatDate={formatDate}
                translations={{
                  edit: tMy("edit"),
                  delete: tMy("delete"),
                  confirmDelete: tMy("confirmDelete"),
                  cancelDelete: tMy("cancelDelete"),
                  deleting: tMy("deleting"),
                  markFound: tMy("markFound"),
                  reopen: tMy("reopen"),
                  found: tMy("found"),
                  author: t("author"),
                  priceTbd: t("priceTbd"),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
