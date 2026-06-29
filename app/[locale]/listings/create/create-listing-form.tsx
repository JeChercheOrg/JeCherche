"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { createListing } from "@/app/actions/listings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Camera, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function CreateListingForm({
  locale,
  categories,
}: {
  locale: string;
  categories: Category[];
}) {
  const t = useTranslations("CreateListing");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + files.length;

    if (totalImages > 5) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("category_id", categoryId);
    if (city) formData.set("city", city);
    if (postalCode) formData.set("postal_code", postalCode);
    if (latitude !== null) formData.set("latitude", latitude.toString());
    if (longitude !== null) formData.set("longitude", longitude.toString());
    formData.set("delivery_available", deliveryAvailable.toString());
    images.forEach((img) => formData.append("images", img));

    const result = await createListing(locale, formData);

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
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-error-light border border-error/20 px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Details section */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-5">
        <Input
          label={t("title")}
          id="title"
          type="text"
          required
          placeholder={t("titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
        />

        <Textarea
          label={t("description")}
          id="description"
          rows={4}
          placeholder={t("descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Select
          label={t("category")}
          id="category"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          error={fieldErrors.category_id}
        >
          <option value="">{t("selectCategory")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </section>

      {/* Location & delivery section */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-5">
        <AddressAutocomplete
          label={t("city")}
          placeholder={t("cityPlaceholder")}
          geolocateLabel={t("geolocate")}
          onSelect={(c, p, lat, lng) => { setCity(c); setPostalCode(p); setLatitude(lat); setLongitude(lng); }}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={deliveryAvailable}
            onChange={(e) => setDeliveryAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
          />
          <span className="text-sm font-medium text-text-primary">
            {t("deliveryLabel")}
          </span>
        </label>
      </section>

      {/* Budget & Photos section */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="price" className="text-sm font-medium text-text-primary">
            {t("price")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-medium">
              EUR
            </span>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface pl-12 pr-3 text-sm text-text-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
            />
          </div>
          {fieldErrors.price && (
            <p className="text-xs text-error">{fieldErrors.price}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            {t("images")}
          </label>
          <p className="text-xs text-text-tertiary">{t("maxImages")}</p>

          {previews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {previews.map((src, i) => (
                <div key={i} className="relative shrink-0 group">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-primary text-text-primary text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {t("coverLabel")}
                    </span>
                  )}
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

          {images.length < 5 && (
            <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary hover:bg-primary-light/50 transition-colors">
              <Camera className="h-8 w-8 text-text-tertiary mb-2" />
              <span className="text-sm font-medium text-text-secondary">
                {t("addImages")}
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
      </section>

      {/* Submit */}
      <div className="sticky bottom-4 sm:static">
        <Button type="submit" disabled={loading} fullWidth size="lg">
          {loading ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
