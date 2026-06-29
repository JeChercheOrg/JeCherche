import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { HeaderSearch } from "@/components/header-search";
import { UserMenu } from "@/components/user-menu";

interface HeaderProps {
  user: { id?: string; email?: string } | null;
  locale: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  unreadCount?: number;
  translations: {
    login: string;
    signup: string;
    publish: string;
    myListings: string;
    favorites: string;
    messages: string;
    listings: string;
    searchPlaceholder: string;
  };
}

export function Header({ user, locale, avatarUrl, displayName, unreadCount, translations }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 h-14 sm:h-16 flex items-center gap-3 sm:gap-4">
        <Logo href={`/${locale}`} />
        <div className="hidden sm:flex flex-1 justify-center">
          <Suspense fallback={<div className="w-full max-w-md" />}>
            <HeaderSearch locale={locale} placeholder={translations.searchPlaceholder} />
          </Suspense>
        </div>
        <div className="ml-auto">
          <UserMenu user={user} locale={locale} avatarUrl={avatarUrl} displayName={displayName} unreadCount={unreadCount} translations={translations} />
        </div>
      </div>
    </header>
  );
}
