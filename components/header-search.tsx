"use client";

import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search-bar";

interface HeaderSearchProps {
  locale: string;
  placeholder: string;
}

export function HeaderSearch({ locale, placeholder }: HeaderSearchProps) {
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  if (!isHome) return null;

  return (
    <SearchBar
      placeholder={placeholder}
      action={`/${locale}/listings`}
      className="relative w-full max-w-md"
    />
  );
}
