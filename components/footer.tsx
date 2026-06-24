import Link from "next/link";

interface FooterProps {
  locale: string;
  translations: {
    listings: string;
    publish: string;
  };
}

export function Footer({ locale, translations }: FooterProps) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 flex items-center justify-between">
        <p className="text-xs sm:text-sm text-text-tertiary">
          © {new Date().getFullYear()} JeCherche
        </p>
        <nav className="flex items-center gap-4 sm:gap-5">
          <Link
            href={`/${locale}/listings`}
            className="text-sm text-text-tertiary hover:text-text-primary transition-colors py-1"
          >
            {translations.listings}
          </Link>
          <Link
            href={`/${locale}/listings/create`}
            className="text-sm text-text-tertiary hover:text-text-primary transition-colors py-1"
          >
            {translations.publish}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
