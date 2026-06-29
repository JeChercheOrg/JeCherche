"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle, RotateCcw, MessageSquare, Flame, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteListing, toggleListingStatus } from "@/app/actions/listings";

interface AdminListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    created_at: string;
    status?: string;
    city?: string | null;
    listing_images?: { storage_path: string; position: number }[];
    categories?: {
      name: string;
      name_fr: string | null;
      name_es: string | null;
      name_de: string | null;
    } | null;
    responses?: { count: number }[];
  };
  locale: string;
  authorName: string;
  formatPrice: (price: number) => string;
  formatDate: (date: Date) => string;
  translations: {
    edit: string;
    delete: string;
    confirmDelete: string;
    cancelDelete: string;
    deleting: string;
    markFound: string;
    reopen: string;
    found: string;
    author: string;
    priceTbd: string;
  };
}

function getCategoryName(
  category: {
    name: string;
    name_fr: string | null;
    name_es: string | null;
    name_de: string | null;
  },
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export function AdminListingCard({
  listing,
  locale,
  authorName,
  formatPrice,
  formatDate,
  translations,
}: AdminListingCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const coverImage = listing.listing_images?.find((img) => img.position === 0);
  const responseCount = listing.responses?.[0]?.count ?? 0;
  const isFound = listing.status === "found";

  async function handleDelete() {
    setDeleting(true);
    await deleteListing(locale, listing.id);
    setDeleting(false);
  }

  async function handleToggleStatus() {
    setToggling(true);
    await toggleListingStatus(locale, listing.id);
    setToggling(false);
  }

  return (
    <article className="rounded-lg border border-border bg-surface overflow-hidden">
      <Link href={`/${locale}/listings/${listing.id}`}>
        <div className={`relative aspect-[4/3] bg-background ${isFound ? "grayscale-[40%]" : ""}`}>
          {coverImage ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${coverImage.storage_path}`}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-text-tertiary text-sm">No image</span>
            </div>
          )}
          {listing.categories && (
            <div className="absolute top-2 left-2">
              <Badge variant="default" className="bg-surface/90 backdrop-blur-sm">
                {getCategoryName(listing.categories, locale)}
              </Badge>
            </div>
          )}
          {isFound && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-600/90 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-white">
                <CheckCircle className="h-3 w-3" />
                {translations.found}
              </span>
            </div>
          )}
          {responseCount > 0 && (
            <div className="absolute bottom-2 right-2">
              {responseCount >= 10 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/90 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white">
                  <Flame className="h-3 w-3" />
                  {responseCount}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-text-primary">
                  <MessageSquare className="h-3 w-3" />
                  {responseCount}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <p className="text-lg font-bold text-primary-text mb-1">
          {listing.price === 0 ? (
            <span className="text-sm font-semibold text-text-secondary">{translations.priceTbd}</span>
          ) : (
            formatPrice(listing.price)
          )}
        </p>
        <h2 className="text-sm font-medium text-text-primary truncate">
          {listing.title}
        </h2>
        <span className="inline-flex items-center gap-1 text-xs text-text-tertiary mt-1">
          <User className="h-3 w-3" />
          {authorName}
        </span>
        <time dateTime={listing.created_at} className="text-xs text-text-tertiary mt-0.5 block">
          {formatDate(new Date(listing.created_at))}
        </time>

        {confirming ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-text-secondary">
              {translations.confirmDelete}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? translations.deleting : translations.delete}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                {translations.cancelDelete}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/${locale}/my-listings/${listing.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {translations.edit}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleStatus}
              disabled={toggling}
              className={
                isFound
                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
              }
            >
              {isFound ? (
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              )}
              {isFound ? translations.reopen : translations.markFound}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {translations.delete}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
