import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  locale: string;
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  /** Path (without locale prefix) the page links point to. Defaults to "/listings". */
  basePath?: string;
  translations: {
    previous: string;
    next: string;
    pageInfo: string;
    pageLabel: string;
  };
}

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({
  locale,
  currentPage,
  totalPages,
  searchParams,
  basePath = "/listings",
  translations,
}: PaginationProps) {
  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/${locale}${basePath}${qs ? `?${qs}` : ""}`;
  };

  const pages = buildPageList(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const arrowBase =
    "inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors";
  const arrowEnabled =
    "border-border bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary";
  const arrowDisabled =
    "border-border bg-surface text-text-tertiary opacity-50 cursor-not-allowed";

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-2"
    >
      {isFirst ? (
        <span className={`${arrowBase} ${arrowDisabled}`} aria-disabled="true">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{translations.previous}</span>
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage - 1)}
          rel="prev"
          className={`${arrowBase} ${arrowEnabled}`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{translations.previous}</span>
        </Link>
      )}

      {/* Mobile: compact "Page X of Y" */}
      <span className="sm:hidden px-2 text-sm text-text-secondary">
        {translations.pageInfo}
      </span>

      {/* Desktop: numbered pages */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-sm text-text-tertiary select-none"
            >
              …
            </span>
          ) : page === currentPage ? (
            <span
              key={page}
              aria-current="page"
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-primary bg-primary-light px-3 text-sm font-semibold text-primary-text"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={hrefFor(page)}
              aria-label={`${translations.pageLabel} ${page}`}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
            >
              {page}
            </Link>
          )
        )}
      </div>

      {isLast ? (
        <span className={`${arrowBase} ${arrowDisabled}`} aria-disabled="true">
          <span className="hidden sm:inline">{translations.next}</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage + 1)}
          rel="next"
          className={`${arrowBase} ${arrowEnabled}`}
        >
          <span className="hidden sm:inline">{translations.next}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
