import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    created_at: string;
    city?: string | null;
    postal_code?: string | null;
    listing_images?: { storage_path: string; position: number }[];
    categories?: { name: string; name_fr: string | null; name_es: string | null; name_de: string | null } | null;
  };
  locale: string;
  formatPrice: (price: number) => string;
  formatDate: (date: Date) => string;
}

function getCategoryName(
  category: { name: string; name_fr: string | null; name_es: string | null; name_de: string | null },
  locale: string
): string {
  if (locale === "fr" && category.name_fr) return category.name_fr;
  if (locale === "es" && category.name_es) return category.name_es;
  if (locale === "de" && category.name_de) return category.name_de;
  return category.name;
}

export function ListingCard({ listing, locale, formatPrice, formatDate }: ListingCardProps) {
  const coverImage = listing.listing_images?.find(
    (img) => img.position === 0
  );

  return (
    <Link href={`/${locale}/listings/${listing.id}`}>
      <article className="group rounded-lg border border-border bg-surface overflow-hidden transition-shadow duration-200 hover:shadow-md">
        <div className="relative aspect-[4/3] bg-background">
          {coverImage ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${coverImage.storage_path}`}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
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
        </div>
        <div className="p-4">
          <p className="text-lg font-bold text-primary-text mb-1">
            {formatPrice(listing.price)}
          </p>
          <h2 className="text-sm font-medium text-text-primary truncate">
            {listing.title}
          </h2>
          {listing.city && (
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary mt-1">
              <MapPin className="h-3 w-3" />
              {listing.city} {listing.postal_code}
            </span>
          )}
          <time dateTime={listing.created_at} className="text-xs text-text-tertiary mt-1 block">
            {formatDate(new Date(listing.created_at))}
          </time>
        </div>
      </article>
    </Link>
  );
}
