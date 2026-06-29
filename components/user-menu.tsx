import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { UnreadBadge } from "@/components/unread-badge";
import { MessageCircle, Plus, List, Heart, Shield } from "lucide-react";

interface UserMenuProps {
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
    admin?: string;
  };
  isAdmin?: boolean;
}

export function UserMenu({ user, locale, avatarUrl, displayName, unreadCount, translations, isAdmin }: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/login`}>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2.5 sm:px-3 py-2">
            {translations.login}
          </Button>
        </Link>
        <Link href={`/${locale}/signup`}>
          <Button variant="secondary" size="sm" className="text-xs sm:text-sm px-2.5 sm:px-3 py-2">
            {translations.signup}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <Link href={`/${locale}/listings/create`}>
        <Button variant="primary" size="sm" className="px-2.5 sm:px-3 py-2">
          <Plus className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">{translations.publish}</span>
        </Button>
      </Link>
      <Link href={`/${locale}/my-listings`}>
        <Button variant="ghost" size="sm" className="px-2.5 sm:px-3 py-2">
          <List className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">{translations.myListings}</span>
        </Button>
      </Link>
      <Link href={`/${locale}/favorites`}>
        <Button variant="ghost" size="sm" className="px-2.5 sm:px-3 py-2">
          <Heart className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">{translations.favorites}</span>
        </Button>
      </Link>
      {isAdmin && translations.admin && (
        <Link href={`/${locale}/admin`}>
          <Button variant="ghost" size="sm" className="px-2.5 sm:px-3 py-2 text-amber-600 hover:text-amber-700">
            <Shield className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">{translations.admin}</span>
          </Button>
        </Link>
      )}
      <Link href={`/${locale}/messages`} className="relative">
        <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 sm:px-3 py-2">
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{translations.messages}</span>
        </Button>
        {user.id && (
          <UnreadBadge initialCount={unreadCount ?? 0} currentUserId={user.id} />
        )}
      </Link>
      <Link href={`/${locale}/account`}>
        <UserAvatar
          displayName={displayName || user.email}
          avatarUrl={avatarUrl}
          size="sm"
        />
      </Link>
    </div>
  );
}
