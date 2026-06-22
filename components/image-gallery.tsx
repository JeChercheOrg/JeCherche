"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: { storage_path: string; position: number }[];
  alt: string;
  supabaseUrl: string;
}

export function ImageGallery({ images, alt, supabaseUrl }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [activeIndex, setActiveIndex] = useState(0);

  if (sorted.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-lg bg-background border border-border flex items-center justify-center">
        <span className="text-text-tertiary text-sm">No image</span>
      </div>
    );
  }

  const activeImage = sorted[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-background border border-border">
        <Image
          src={`${supabaseUrl}/storage/v1/object/public/listing-images/${activeImage.storage_path}`}
          alt={`${alt} — ${activeIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((image, index) => (
            <button
              key={image.storage_path}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${index === activeIndex
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-border hover:border-border-hover"
                }`}
            >
              <Image
                src={`${supabaseUrl}/storage/v1/object/public/listing-images/${image.storage_path}`}
                alt={`${alt} — ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
