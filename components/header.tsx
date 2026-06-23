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
    messages: string;
    listings: string;
    searchPlaceholder: string;
  };
}

export function Header({ user, locale, avatarUrl, displayName, unreadCount, translations }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Logo href={`/${locale}`} />
        <Suspense fallback={<div className="w-80" />}>
          <HeaderSearch locale={locale} placeholder={translations.searchPlaceholder} />
        </Suspense>
        <div className="flex justify-end">
          <UserMenu user={user} locale={locale} avatarUrl={avatarUrl} displayName={displayName} unreadCount={unreadCount} translations={translations} />
        </div>
      </div>
    </header>
  );
}
