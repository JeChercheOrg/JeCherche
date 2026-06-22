"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFormatter } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteListing } from "@/app/actions/listings";

interface MyListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    created_at: string;
    listing_images?: { storage_path: string; position: number }[];
    categories?: {
      name: string;
      name_fr: string | null;
      name_es: string | null;
      name_de: string | null;
    } | null;
  };
  locale: string;
  translations: {
    edit: string;
    delete: string;
    confirmDelete: string;
    cancelDelete: string;
    deleting: string;
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

export function MyListingCard({
  listing,
  locale,
  translations,
}: MyListingCardProps) {
  const format = useFormatter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatPrice = (price: number) =>
    format.number(price / 100, { style: "currency", currency: "EUR" });

  const formatDate = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short" });

  const coverImage = listing.listing_images?.find(
    (img) => img.position === 0
  );

  async function handleDelete() {
    setDeleting(true);
    await deleteListing(locale, listing.id);
    setDeleting(false);
  }

  return (
    <article className="rounded-lg border border-border bg-surface overflow-hidden">
      <Link href={`/${locale}/listings/${listing.id}`}>
        <div className="relative aspect-[4/3] bg-background">
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
              <Badge
                variant="default"
                className="bg-surface/90 backdrop-blur-sm"
              >
                {getCategoryName(listing.categories, locale)}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <p className="text-lg font-bold text-primary-text mb-1">
          {formatPrice(listing.price)}
        </p>
        <h2 className="text-sm font-medium text-text-primary truncate">
          {listing.title}
        </h2>
        <span className="text-xs text-text-tertiary mt-1 block">
          {formatDate(new Date(listing.created_at))}
        </span>

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
          <div className="mt-3 flex gap-2">
            <Link href={`/${locale}/my-listings/${listing.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {translations.edit}
              </Button>
            </Link>
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
