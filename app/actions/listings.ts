"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

export async function createListing(
  locale: string,
  formData: FormData
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const categoryId = formData.get("category_id") as string;
  const city = (formData.get("city") as string) || null;
  const postalCode = (formData.get("postal_code") as string) || null;
  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;
  const deliveryAvailable = formData.get("delivery_available") === "true";
  const images = formData.getAll("images") as File[];

  const fieldErrors: Record<string, string> = {};

  if (!title || title.trim().length === 0) {
    fieldErrors.title = "fieldRequired";
  }

  const price = Math.round(parseFloat(priceStr) * 100);
  if (isNaN(price) || price < 0) {
    fieldErrors.price = "pricePositive";
  }

  if (!categoryId) {
    fieldErrors.category_id = "fieldRequired";
  }

  const validImages = images.filter((f) => f.size > 0);

  if (validImages.length === 0) {
    fieldErrors.images = "fieldRequired";
  } else if (validImages.length > MAX_IMAGES) {
    fieldErrors.images = "imageLimitError";
  }

  for (const file of validImages) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      fieldErrors.images = "imageFormatError";
      break;
    }
    if (file.size > MAX_FILE_SIZE) {
      fieldErrors.images = "imageSizeError";
      break;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      price,
      category_id: categoryId,
      user_id: user.id,
      city,
      postal_code: postalCode,
      latitude,
      longitude,
      delivery_available: deliveryAvailable,
    })
    .select("id")
    .single();

  if (insertError || !listing) {
    return { error: "errorGeneric" };
  }

  const uploadedPaths: string[] = [];

  for (let i = 0; i < validImages.length; i++) {
    const file = validImages[i];
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${user.id}/${listing.id}/${i}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      for (const path of uploadedPaths) {
        await supabase.storage.from("listing-images").remove([path]);
      }
      await supabase.from("listings").delete().eq("id", listing.id);
      return { error: "errorGeneric" };
    }

    uploadedPaths.push(storagePath);

    const { error: imageInsertError } = await supabase
      .from("listing_images")
      .insert({
        listing_id: listing.id,
        storage_path: storagePath,
        position: i,
      });

    if (imageInsertError) {
      for (const path of uploadedPaths) {
        await supabase.storage.from("listing-images").remove([path]);
      }
      await supabase.from("listings").delete().eq("id", listing.id);
      return { error: "errorGeneric" };
    }
  }

  redirect(`/${locale}/listings/${listing.id}`);
}

export async function deleteListing(
  locale: string,
  listingId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, listing_images(storage_path)")
    .eq("id", listingId)
    .single();

  if (!listing || (listing.user_id !== user.id && user.app_metadata?.role !== "admin")) {
    return { error: "errorGeneric" };
  }

  const imagePaths = (listing.listing_images || []).map(
    (img: { storage_path: string }) => img.storage_path
  );

  if (imagePaths.length > 0) {
    await supabase.storage.from("listing-images").remove(imagePaths);
  }

  const { error: deleteError } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId);

  if (deleteError) {
    return { error: "errorGeneric" };
  }

  redirect(`/${locale}/listings`);
}

export async function updateListing(
  locale: string,
  listingId: string,
  formData: FormData
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: existing } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .single();

  if (!existing || (existing.user_id !== user.id && user.app_metadata?.role !== "admin")) {
    return { error: "errorGeneric" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const categoryId = formData.get("category_id") as string;
  const city = (formData.get("city") as string) || null;
  const postalCode = (formData.get("postal_code") as string) || null;
  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;
  const deliveryAvailable = formData.get("delivery_available") === "true";
  const imagesToDelete = formData.getAll("images_to_delete") as string[];
  const newImages = (formData.getAll("new_images") as File[]).filter(
    (f) => f.size > 0
  );

  const fieldErrors: Record<string, string> = {};

  if (!title || title.trim().length === 0) {
    fieldErrors.title = "fieldRequired";
  }

  const price = Math.round(parseFloat(priceStr) * 100);
  if (isNaN(price) || price < 0) {
    fieldErrors.price = "pricePositive";
  }

  if (!categoryId) {
    fieldErrors.category_id = "fieldRequired";
  }

  for (const file of newImages) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      fieldErrors.images = "imageFormatError";
      break;
    }
    if (file.size > MAX_FILE_SIZE) {
      fieldErrors.images = "imageSizeError";
      break;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      price,
      category_id: categoryId,
      city,
      postal_code: postalCode,
      latitude,
      longitude,
      delivery_available: deliveryAvailable,
    })
    .eq("id", listingId);

  if (updateError) {
    return { error: "errorGeneric" };
  }

  if (imagesToDelete.length > 0) {
    await supabase.storage.from("listing-images").remove(imagesToDelete);
    await supabase
      .from("listing_images")
      .delete()
      .in("storage_path", imagesToDelete);
  }

  if (newImages.length > 0) {
    const { data: existingImages } = await supabase
      .from("listing_images")
      .select("position")
      .eq("listing_id", listingId)
      .order("position", { ascending: false })
      .limit(1);

    let nextPosition = (existingImages?.[0]?.position ?? -1) + 1;

    for (const file of newImages) {
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${existing.user_id}/${listingId}/${nextPosition}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) continue;

      await supabase.from("listing_images").insert({
        listing_id: listingId,
        storage_path: storagePath,
        position: nextPosition,
      });

      nextPosition++;
    }
  }

  redirect(`/${locale}/listings/${listingId}`);
}

export async function toggleListingStatus(
  locale: string,
  listingId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("user_id, status")
    .eq("id", listingId)
    .single();

  if (!listing || (listing.user_id !== user.id && user.app_metadata?.role !== "admin")) {
    return { error: "errorGeneric" };
  }

  const newStatus = listing.status === "active" ? "found" : "active";

  const { error: updateError } = await supabase
    .from("listings")
    .update({ status: newStatus })
    .eq("id", listingId);

  if (updateError) {
    return { error: "errorGeneric" };
  }

  revalidatePath(`/${locale}/my-listings`);
  revalidatePath(`/${locale}/listings/${listingId}`);
  return {};
}
