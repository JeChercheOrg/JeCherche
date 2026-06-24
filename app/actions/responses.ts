"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 3;

export async function createResponse(
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

  const { data: listing } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { error: "errorGeneric" };
  }

  if (listing.user_id === user.id) {
    return { error: "errorOwnListing" };
  }

  const { data: existing } = await supabase
    .from("responses")
    .select("id")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "errorAlreadyResponded" };
  }

  const message = formData.get("message") as string;
  const priceStr = formData.get("price") as string;
  const images = (formData.getAll("images") as File[]).filter(
    (f) => f.size > 0
  );

  const fieldErrors: Record<string, string> = {};

  if (!message || message.trim().length === 0) {
    fieldErrors.message = "fieldRequired";
  }

  const price = Math.round(parseFloat(priceStr) * 100);
  if (isNaN(price) || price <= 0) {
    fieldErrors.price = "pricePositive";
  }

  if (images.length > MAX_IMAGES) {
    fieldErrors.images = "imageLimitError";
  }

  for (const file of images) {
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

  const { data: response, error: insertError } = await supabase
    .from("responses")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      price,
      message: message.trim(),
    })
    .select("id")
    .single();

  if (insertError || !response) {
    if (insertError?.code === "23505") {
      return { error: "errorAlreadyResponded" };
    }
    return { error: "errorGeneric" };
  }

  if (images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${user.id}/${response.id}/${i}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("response-images")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) continue;

      await supabase.from("response_images").insert({
        response_id: response.id,
        storage_path: storagePath,
        position: i,
      });
    }
  }

  revalidatePath(`/${locale}/listings/${listingId}`);
  return {};
}

export async function acceptResponse(
  locale: string,
  listingId: string,
  responseId: string
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
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return { error: "errorNotOwner" };
  }

  const { error: updateError } = await supabase
    .from("responses")
    .update({ status: "accepted" })
    .eq("id", responseId)
    .eq("listing_id", listingId);

  if (updateError) {
    return { error: "errorGeneric" };
  }

  await supabase
    .from("responses")
    .update({ status: "rejected" })
    .eq("listing_id", listingId)
    .neq("id", responseId)
    .eq("status", "pending");

  revalidatePath(`/${locale}/listings/${listingId}`);
  return {};
}

export async function rejectResponse(
  locale: string,
  listingId: string,
  responseId: string
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
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return { error: "errorNotOwner" };
  }

  const { error: updateError } = await supabase
    .from("responses")
    .update({ status: "rejected" })
    .eq("id", responseId)
    .eq("listing_id", listingId);

  if (updateError) {
    return { error: "errorGeneric" };
  }

  revalidatePath(`/${locale}/listings/${listingId}`);
  return {};
}

export async function updateResponse(
  locale: string,
  responseId: string,
  formData: FormData
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: response } = await supabase
    .from("responses")
    .select("id, user_id, status, listing_id")
    .eq("id", responseId)
    .single();

  if (!response || response.user_id !== user.id) {
    return { error: "errorGeneric" };
  }

  if (response.status !== "pending") {
    return { error: "errorNotPending" };
  }

  const message = formData.get("message") as string;
  const priceStr = formData.get("price") as string;

  const fieldErrors: Record<string, string> = {};

  if (!message || message.trim().length === 0) {
    fieldErrors.message = "fieldRequired";
  }

  const price = Math.round(parseFloat(priceStr) * 100);
  if (isNaN(price) || price <= 0) {
    fieldErrors.price = "pricePositive";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const { error: updateError } = await supabase
    .from("responses")
    .update({
      price,
      message: message.trim(),
    })
    .eq("id", responseId);

  if (updateError) {
    return { error: "errorGeneric" };
  }

  revalidatePath(`/${locale}/listings/${response.listing_id}`);
  return {};
}

const ACCEPT_MESSAGES: Record<string, string> = {
  fr: "J'accepte votre prix.",
  en: "I accept your price.",
  es: "Acepto tu precio.",
  de: "Ich akzeptiere Ihren Preis.",
};

export async function acceptListing(
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
    .select("user_id, price")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { error: "errorGeneric" };
  }

  if (listing.user_id === user.id) {
    return { error: "errorOwnListing" };
  }

  const { error: insertError } = await supabase
    .from("responses")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      price: listing.price,
      message: ACCEPT_MESSAGES[locale] || ACCEPT_MESSAGES.en,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "errorAlreadyResponded" };
    }
    return { error: "errorGeneric" };
  }

  revalidatePath(`/${locale}/listings/${listingId}`);
  return {};
}
