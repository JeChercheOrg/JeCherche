"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { acceptResponse, rejectResponse, updateResponse } from "@/app/actions/responses";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { Tag, Pencil, Check, X, ArrowRight } from "lucide-react";

interface OfferResponse {
  id: string;
  price: number;
  message: string;
  status: string;
  user_id: string;
  images: { storage_path: string; position: number }[];
}

interface ConversationOfferCardProps {
  response: OfferResponse;
  listingId: string;
  listingPrice: number;
  isBuyer: boolean;
  locale: string;
  onResponseChanged: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-primary-light text-primary-text border-primary/20",
  accepted: "bg-success-light text-success border-success/20",
  rejected: "bg-error-light text-error border-error/20",
};

export function ConversationOfferCard({
  response,
  listingId,
  listingPrice,
  isBuyer,
  locale,
  onResponseChanged,
}: ConversationOfferCardProps) {
  const t = useTranslations("Messages");
  const { showToast } = useToast();
  const [loading, setLoading] = useState<"accept" | "reject" | "update" | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPrice, setEditPrice] = useState((response.price / 100).toString());
  const [editMessage, setEditMessage] = useState(response.message);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const sortedImages = [...response.images].sort((a, b) => a.position - b.position);

  const priceDiffPercent =
    listingPrice > 0
      ? Math.round(((response.price - listingPrice) / listingPrice) * 100)
      : 0;
  const priceColor =
    response.price < listingPrice
      ? "text-success"
      : response.price > listingPrice
        ? "text-error"
        : "text-text-primary";

  async function handleAccept() {
    setLoading("accept");
    setError(null);
    const result = await acceptResponse(locale, listingId, response.id);
    if (result?.error) {
      setError(t(result.error));
    } else {
      showToast(t("offerAccepted"));
      onResponseChanged();
    }
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    const result = await rejectResponse(locale, listingId, response.id);
    if (result?.error) {
      setError(t(result.error));
    } else {
      showToast(t("offerRejected"));
      onResponseChanged();
    }
    setLoading(null);
  }

  async function handleUpdate() {
    setLoading("update");
    setError(null);
    const formData = new FormData();
    formData.set("price", editPrice);
    formData.set("message", editMessage);
    const result = await updateResponse(locale, response.id, formData);
    if (result?.error) {
      setError(t(result.error));
    } else if (result?.fieldErrors) {
      const firstError = Object.values(result.fieldErrors)[0];
      setError(t(firstError));
    } else {
      showToast(t("offerUpdated"));
      setEditing(false);
      onResponseChanged();
    }
    setLoading(null);
  }

  function handleCancelEdit() {
    setEditing(false);
    setEditPrice((response.price / 100).toString());
    setEditMessage(response.message);
    setError(null);
  }

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);

  return (
    <div className="mx-4 mt-3 rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-4 space-y-3 shrink-0">
      {/* Header: label + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-text-tertiary" />
          <span className="text-sm font-medium text-text-secondary">
            {isBuyer ? t("receivedOffer") : t("myOffer")}
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[response.status] || STATUS_STYLES.pending}`}
        >
          {response.status === "accepted"
            ? t("statusAccepted")
            : response.status === "rejected"
              ? t("statusRejected")
              : t("statusPending")}
        </span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">
              {t("offeredPrice")}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">
              {t("offerMessage")}
            </label>
            <textarea
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={loading !== null}
            >
              {loading === "update" ? t("editingOffer") : t("save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={loading !== null}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Price comparison */}
          <div className="flex items-center gap-3 rounded-lg bg-background/60 px-3 py-2.5">
            <div className="flex flex-col items-start">
              <span className="text-[11px] uppercase tracking-wide text-text-tertiary font-medium">
                {t("askedPrice")}
              </span>
              <span className="text-sm font-semibold text-text-secondary">
                {formatCurrency(listingPrice)}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] uppercase tracking-wide text-text-tertiary font-medium">
                {t("offeredPrice")}
              </span>
              <span className={`text-sm font-bold ${priceColor}`}>
                {formatCurrency(response.price)}
              </span>
            </div>
            {priceDiffPercent !== 0 && (
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                priceDiffPercent < 0
                  ? "bg-success-light text-success"
                  : "bg-error-light text-error"
              }`}>
                {priceDiffPercent > 0 ? "+" : ""}{priceDiffPercent} %
              </span>
            )}
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
                  className="relative shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border"
                >
                  <Image
                    src={`${supabaseUrl}/storage/v1/object/public/response-images/${image.storage_path}`}
                    alt={`${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!editing && response.status === "pending" && (
        <div className="flex items-center gap-2 pt-1">
          {isBuyer ? (
            <>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={loading !== null}
              >
                <Check className="h-3.5 w-3.5" />
                {loading === "accept" ? t("submitting") : t("accept")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleReject}
                disabled={loading !== null}
              >
                <X className="h-3.5 w-3.5" />
                {loading === "reject" ? t("submitting") : t("reject")}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("editOffer")}
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
