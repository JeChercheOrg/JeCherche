import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CategoryBarProps {
  categories: { id: string; name: string; name_fr: string | null; name_es: string | null; name_de: string | null }[];
  locale: string;
  currentCategory?: string;
  currentQuery?: string;
  allLabel: string;
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

function buildHref(locale: string, query?: string, categoryId?: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (categoryId) params.set("category", categoryId);
  const qs = params.toString();
  return qs ? `/${locale}?${qs}` : `/${locale}`;
}

export function CategoryBar({
  categories,
  locale,
  currentCategory,
  currentQuery,
  allLabel,
}: CategoryBarProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Link href={buildHref(locale, currentQuery)}>
        <Badge
          variant={!currentCategory ? "primary" : "default"}
          className="whitespace-nowrap cursor-pointer hover:bg-primary-light hover:text-primary-text transition-colors shrink-0"
        >
          {allLabel}
        </Badge>
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={buildHref(locale, currentQuery, category.id)}
        >
          <Badge
            variant={currentCategory === category.id ? "primary" : "default"}
            className="whitespace-nowrap cursor-pointer hover:bg-primary-light hover:text-primary-text transition-colors shrink-0"
          >
            {getCategoryName(category, locale)}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
