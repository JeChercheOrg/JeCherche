import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

interface UserMenuProps {
  user: { email?: string } | null;
  locale: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  translations: {
    login: string;
    signup: string;
    publish: string;
    myListings: string;
  };
}

export function UserMenu({ user, locale, avatarUrl, displayName, translations }: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/login`}>
          <Button variant="ghost" size="sm">
            {translations.login}
          </Button>
        </Link>
        <Link href={`/${locale}/signup`}>
          <Button variant="secondary" size="sm">
            {translations.signup}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href={`/${locale}/listings/create`}>
        <Button variant="primary" size="sm">
          {translations.publish}
        </Button>
      </Link>
      <Link href={`/${locale}/my-listings`}>
        <Button variant="ghost" size="sm">
          {translations.myListings}
        </Button>
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
