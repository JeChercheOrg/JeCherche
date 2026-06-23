"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder: string;
  action: string;
  className?: string;
}

export function SearchBar({ placeholder, action, className }: SearchBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentQuery = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";

  function handleClear() {
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }

  return (
    <form method="GET" action={action} className={className || "relative flex-1 max-w-xl"}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
      <input
        type="search"
        name="q"
        defaultValue={currentQuery}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-9 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
      />
      {currentCategory && (
        <input type="hidden" name="category" value={currentCategory} />
      )}
      {currentQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
