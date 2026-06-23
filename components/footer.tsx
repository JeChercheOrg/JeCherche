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
      <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          © {new Date().getFullYear()} JeCherche
        </p>
        <nav className="flex items-center gap-4">
          <Link
            href={`/${locale}/listings`}
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            {translations.listings}
          </Link>
          <Link
            href={`/${locale}/listings/create`}
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            {translations.publish}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
