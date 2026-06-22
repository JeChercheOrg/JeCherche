"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createResponse } from "@/app/actions/responses";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { Camera, X } from "lucide-react";

export function ResponseForm({
  locale,
  listingId,
  listingPrice,
}: {
  locale: string;
  listingId: string;
  listingPrice?: number;
}) {
  const t = useTranslations("Responses");
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [price, setPrice] = useState("");
  const [rawPrice, setRawPrice] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    if (!listingPrice || !rawPrice) {
      setPriceWarning(null);
      return;
    }

    warningTimerRef.current = setTimeout(() => {
      const numericValue = parseFloat(rawPrice);
      if (isNaN(numericValue) || numericValue <= 0) {
        setPriceWarning(null);
        return;
      }
      const listingPriceEur = listingPrice / 100;
      if (numericValue < listingPriceEur * 0.5) {
        setPriceWarning(t("priceTooLow"));
      } else if (numericValue > listingPriceEur * 2) {
        setPriceWarning(t("priceTooHigh"));
      } else {
        setPriceWarning(null);
      }
    }, 800);

    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [rawPrice, listingPrice, t]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + files.length;

    if (totalImages > 3) {
      setFieldErrors((prev) => ({ ...prev, images: t("imageLimitError") }));
      return;
    }

    const newImages = [...images, ...files];
    const newPreviews = [
      ...previews,
      ...files.map((f) => URL.createObjectURL(f)),
    ];

    setImages(newImages);
    setPreviews(newPreviews);
    setFieldErrors((prev) => {
      const { images: _, ...rest } = prev;
      return rest;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value;
    const cleaned = input.replace(/[^\d.,]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    const numericValue = parseFloat(cleaned);
    if (cleaned && !isNaN(numericValue) && numericValue > 99999) return;

    setRawPrice(cleaned);

    if (cleaned === "" || cleaned.endsWith(".") || cleaned === "0.") {
      setPrice(input);
      return;
    }

    if (!isNaN(numericValue)) {
      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: parts[1] ? parts[1].length : 0,
        maximumFractionDigits: 2,
      });
      setPrice(formatter.format(numericValue));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set("price", rawPrice);
    formData.set("message", message);
    images.forEach((img) => formData.append("images", img));

    const result = await createResponse(locale, listingId, formData);

    if (result?.fieldErrors) {
      const translated: Record<string, string> = {};
      for (const [key, val] of Object.entries(result.fieldErrors)) {
        translated[key] = t(val);
      }
      setFieldErrors(translated);
      setLoading(false);
      return;
    }

    if (result?.error) {
      setError(t(result.error));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    showToast(t("successMessage"));
    router.refresh();
  }

  if (success) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary-light/30 p-6 text-center">
        <p className="text-sm font-medium text-text-primary">
          {t("successMessage")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-semibold text-text-primary">
        {t("makeOffer")}
      </h3>

      {error && (
        <div className="rounded-md bg-error-light border border-error/20 px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="response-price" className="text-sm font-medium text-text-primary">
            {t("price")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-medium">
              EUR
            </span>
            <input
              id="response-price"
              type="text"
              inputMode="decimal"
              required
              placeholder={listingPrice ? new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(listingPrice / 100) : undefined}
              value={price}
              onChange={handlePriceChange}
              className="h-11 w-full rounded-md border border-border bg-surface pl-12 pr-3 text-sm text-text-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
            />
          </div>
          {fieldErrors.price && (
            <p className="text-xs text-error">{fieldErrors.price}</p>
          )}
          {!fieldErrors.price && priceWarning && (
            <p className="text-xs text-secondary font-medium">{priceWarning}</p>
          )}
        </div>

        <Textarea
          label={t("message")}
          id="response-message"
          rows={3}
          required
          placeholder={t("messagePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={fieldErrors.message}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            {t("photos")}
          </label>
          <p className="text-xs text-text-tertiary">{t("maxPhotos")}</p>

          {previews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {previews.map((src, i) => (
                <div key={i} className="relative shrink-0 group">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-error text-text-inverse rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 3 && (
            <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-primary-light/50 transition-colors">
              <Camera className="h-6 w-6 text-text-tertiary mb-1" />
              <span className="text-sm font-medium text-text-secondary">
                {t("addPhotos")}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}

          {fieldErrors.images && (
            <p className="text-xs text-error">{fieldErrors.images}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
