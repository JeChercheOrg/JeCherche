"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { createListing } from "@/app/actions/listings";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          {t("title")}
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {fieldErrors.title && (
          <p className="text-red-600 text-xs mt-1">{fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          {t("description")}
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium">
          {t("price")}
        </label>
        <div className="mt-1 relative">
          <input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-8"
          />
          <span className="absolute right-3 top-2 text-gray-500">€</span>
        </div>
        {fieldErrors.price && (
          <p className="text-red-600 text-xs mt-1">{fieldErrors.price}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          {t("category")}
        </label>
        <select
          id="category"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">{t("selectCategory")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {fieldErrors.category_id && (
          <p className="text-red-600 text-xs mt-1">{fieldErrors.category_id}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t("images")}</label>
        <p className="text-xs text-gray-500 mb-2">{t("maxImages")}</p>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {previews.map((src, i) => (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-24 object-cover rounded-md border border-gray-200"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {t("coverLabel")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < 5 && (
          <label className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-4 text-center text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
            {t("addImages")}
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
          <p className="text-red-600 text-xs mt-1">{fieldErrors.images}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
