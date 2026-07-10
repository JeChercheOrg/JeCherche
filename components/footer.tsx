import Link from "next/link";

interface FooterProps {
  locale: string;
  translations: {
    listings: string;
    publish: string;
    legalNotice: string;
    privacy: string;
    terms: string;
    cookies: string;
  };
}

export function Footer({ locale, translations }: FooterProps) {
  const linkClass =
    "text-sm text-text-tertiary hover:text-text-primary transition-colors py-1";

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-text-tertiary">
          © {new Date().getFullYear()} VendsMoi
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-5">
          <Link href={`/${locale}/listings`} className={linkClass}>
            {translations.listings}
          </Link>
          <Link href={`/${locale}/listings/create`} className={linkClass}>
            {translations.publish}
          </Link>
          <Link href={`/${locale}/legal/mentions-legales`} className={linkClass}>
            {translations.legalNotice}
          </Link>
          <Link href={`/${locale}/legal/confidentialite`} className={linkClass}>
            {translations.privacy}
          </Link>
          <Link href={`/${locale}/legal/cgu`} className={linkClass}>
            {translations.terms}
          </Link>
          <Link href={`/${locale}/legal/cookies`} className={linkClass}>
            {translations.cookies}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
