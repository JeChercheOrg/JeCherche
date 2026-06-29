"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorites";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  locale: string;
  variant?: "card" | "detail";
}

export function FavoriteButton({
  listingId,
  initialFavorited,
  isAuthenticated,
  locale,
  variant = "card",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    setFavorited(!favorited);
    setLoading(true);

    const result = await toggleFavorite(listingId);

    if (result.error) {
      setFavorited(favorited);
    } else {
      setFavorited(result.favorited);
    }

    setLoading(false);
  }

  if (variant === "detail") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background disabled:opacity-50"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${favorited
              ? "fill-red-500 text-red-500"
              : "text-text-tertiary"
            }`}
        />
        <span className={favorited ? "text-red-500" : "text-text-secondary"}>
          {favorited ? "Favori" : "Favori"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-black/30 backdrop-blur-sm shadow-md p-2 transition-all hover:scale-110 hover:bg-black/40 disabled:opacity-50"
    >
      <Heart
        className={`h-[18px] w-[18px] drop-shadow-sm transition-colors ${favorited
            ? "fill-red-500 text-red-500"
            : "text-white"
          }`}
      />
    </button>
  );
}
