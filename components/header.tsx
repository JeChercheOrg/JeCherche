import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { SearchBar } from "@/components/search-bar";
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
    searchPlaceholder: string;
  };
}

export function Header({ user, locale, avatarUrl, displayName, unreadCount, translations }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
        <Logo href={`/${locale}`} />
        <Suspense
          fallback={
            <div className="relative flex-1 max-w-xl">
              <div className="h-10 w-full rounded-full border border-border bg-surface" />
            </div>
          }
        >
          <SearchBar
            placeholder={translations.searchPlaceholder}
            action={`/${locale}`}
          />
        </Suspense>
        <UserMenu user={user} locale={locale} avatarUrl={avatarUrl} displayName={displayName} unreadCount={unreadCount} translations={translations} />
      </div>
    </header>
  );
}
