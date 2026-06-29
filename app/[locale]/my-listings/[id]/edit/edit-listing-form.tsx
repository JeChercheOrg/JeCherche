"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { updateListing } from "@/app/actions/listings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Camera, X } from "lucide-react";

interface ExistingImage {
  id: string;
  storage_path: string;
  position: number;
}

interface Category {
  id: string;
  name: string;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category_id: string;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  delivery_available?: boolean;
  listing_images?: ExistingImage[];
}

export default function EditListingForm({
  locale,
  listing,
  categories,
}: {
  locale: string;
  listing: Listing;
  categories: Category[];
}) {
  const t = useTranslations("CreateListing");
  const tMy = useTranslations("MyListings");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description || "");
  const [price, setPrice] = useState((listing.price / 100).toString());
  const [categoryId, setCategoryId] = useState(listing.category_id);
  const [city, setCity] = useState(listing.city || "");
  const [postalCode, setPostalCode] = useState(listing.postal_code || "");
  const [latitude, setLatitude] = useState<number | null>(listing.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(listing.longitude ?? null);
  const [deliveryAvailable, setDeliveryAvailable] = useState(listing.delivery_available || false);

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    (listing.listing_images || []).sort((a, b) => a.position - b.position)
  );
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const totalImages =
    existingImages.length - imagesToDelete.length + newImages.length;

  function handleRemoveExisting(storagePath: string) {
    setImagesToDelete((prev) => [...prev, storagePath]);
  }

  function handleRestoreExisting(storagePath: string) {
    setImagesToDelete((prev) => prev.filter((p) => p !== storagePath));
  }

  function handleNewImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const allowed = 5 - totalImages;

    if (files.length > allowed) {
      setFieldErrors((prev) => ({ ...prev, images: t("imageLimitError") }));
      return;
    }

    setNewImages((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    setFieldErrors((prev) => {
      const { images: _, ...rest } = prev;
      return rest;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
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
    imagesToDelete.forEach((path) =>
      formData.append("images_to_delete", path)
    );
    newImages.forEach((img) => formData.append("new_images", img));

    const result = await updateListing(locale, listing.id, formData);

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

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-5">
        <Input
          label={t("title")}
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
        />

        <Textarea
          label={t("description")}
          id="description"
          rows={4}
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

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-5">
        <AddressAutocomplete
          label={t("city")}
          placeholder={t("cityPlaceholder")}
          defaultCity={listing.city || undefined}
          defaultPostalCode={listing.postal_code || undefined}
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

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="price"
            className="text-sm font-medium text-text-primary"
          >
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

          {existingImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {existingImages.map((img) => {
                const isMarkedForDelete = imagesToDelete.includes(
                  img.storage_path
                );
                return (
                  <div key={img.id} className="relative shrink-0 group">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${img.storage_path}`}
                      alt={`Image ${img.position + 1}`}
                      width={80}
                      height={80}
                      className={`w-20 h-20 object-cover rounded-lg border border-border ${isMarkedForDelete ? "opacity-30" : ""
                        }`}
                    />
                    {img.position === 0 && !isMarkedForDelete && (
                      <span className="absolute bottom-1 left-1 bg-primary text-text-primary text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {t("coverLabel")}
                      </span>
                    )}
                    {isMarkedForDelete ? (
                      <button
                        type="button"
                        onClick={() => handleRestoreExisting(img.storage_path)}
                        className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-secondary bg-surface/60 rounded-lg"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(img.storage_path)}
                        className="absolute -top-1.5 -right-1.5 bg-error text-text-inverse rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {newPreviews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative shrink-0 group">
                  <img
                    src={src}
                    alt={`New ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-error text-text-inverse rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalImages < 5 && (
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
                onChange={handleNewImageChange}
                className="hidden"
              />
            </label>
          )}

          {fieldErrors.images && (
            <p className="text-xs text-error">{fieldErrors.images}</p>
          )}
        </div>
      </section>

      <div className="sticky bottom-4 sm:static">
        <Button type="submit" disabled={loading} fullWidth size="lg">
          {loading ? tMy("saving") : tMy("save")}
        </Button>
      </div>
    </form>
  );
}
