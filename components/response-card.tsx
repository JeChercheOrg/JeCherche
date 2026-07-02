import Link from "next/link";
import Image from "next/image";
import { UserAvatar } from "@/components/user-avatar";
import { ResponseActions } from "@/components/response-actions";
import { ResponseAdminActions } from "@/components/response-admin-actions";
import { ContactButton } from "@/components/contact-button";

interface ResponseCardProps {
  response: {
    id: string;
    price: number;
    message: string;
    created_at: string;
    user_id: string;
    status: string;
    profiles: { display_name: string | null; avatar_path: string | null } | null;
    response_images: { storage_path: string; position: number }[];
  };
  locale: string;
  listingId: string;
  listingPrice: number;
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  supabaseUrl: string;
  isOwn?: boolean;
  isListingOwner?: boolean;
  isAdmin?: boolean;
  translations: {
    yourOffer: string;
    offeredPrice: string;
    statusPending: string;
    statusAccepted: string;
    statusRejected: string;
  };
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-primary-light text-primary-text border-primary/20",
  accepted: "bg-success-light text-success border-success/20",
  rejected: "bg-error-light text-error border-error/20",
};

export function ResponseCard({
  response,
  locale,
  listingId,
  listingPrice,
  formatPrice,
  formatDate,
  supabaseUrl,
  isOwn,
  isListingOwner,
  isAdmin,
  translations,
}: ResponseCardProps) {
  const displayName = response.profiles?.display_name || "?";
  const avatarUrl = response.profiles?.avatar_path
    ? `${supabaseUrl}/storage/v1/object/public/avatars/${response.profiles.avatar_path}`
    : null;

  const sortedImages = [...response.response_images].sort(
    (a, b) => a.position - b.position
  );

  const priceDiffPercent = listingPrice > 0
    ? Math.round(((response.price - listingPrice) / listingPrice) * 100)
    : 0;
  const priceColor =
    response.price < listingPrice
      ? "text-success"
      : response.price > listingPrice
        ? "text-error"
        : "text-text-primary";

  return (
    <div
      className={`rounded-xl border bg-surface p-4 sm:p-5 space-y-3 ${isOwn ? "border-primary ring-2 ring-primary/30 bg-primary-light/20" : "border-border"}`}
    >
      {/* Main row: user / price / date */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/${locale}/users/${response.user_id}`}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <UserAvatar
            displayName={displayName}
            avatarUrl={avatarUrl}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-text-primary group-hover:underline">
              {displayName}
            </p>
            {isOwn && (
              <span className="text-xs text-primary font-medium">
                {translations.yourOffer}
              </span>
            )}
          </div>
        </Link>

        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`text-base sm:text-lg font-bold ${priceColor}`}>
              {formatPrice(response.price)}
            </span>
            {priceDiffPercent !== 0 && (
              <span className={`text-xs font-medium ${priceColor}`}>
                {priceDiffPercent > 0 ? "+" : ""}{priceDiffPercent}%
              </span>
            )}
          </span>
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {formatDate(response.created_at)}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[response.status] || STATUS_STYLES.pending}`}
          >
            {response.status === "accepted"
              ? translations.statusAccepted
              : response.status === "rejected"
                ? translations.statusRejected
                : translations.statusPending}
          </span>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
        {response.message}
      </p>

      {/* Photos */}
      {sortedImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sortedImages.map((image, index) => (
            <div
              key={image.storage_path}
              className="relative shrink-0 w-20 h-20 rounded-md overflow-hidden border border-border"
            >
              <Image
                src={`${supabaseUrl}/storage/v1/object/public/response-images/${image.storage_path}`}
                alt={`${displayName} — ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions for listing owner */}
      {isListingOwner && (
        <div className="flex items-center gap-2 pt-2">
          {response.status === "pending" && (
            <ResponseActions
              locale={locale}
              listingId={listingId}
              responseId={response.id}
            />
          )}
          <ContactButton locale={locale} responseId={response.id} />
        </div>
      )}

      {/* Moderation action for admins */}
      {isAdmin && (
        <ResponseAdminActions
          locale={locale}
          listingId={listingId}
          responseId={response.id}
        />
      )}
    </div>
  );
}
