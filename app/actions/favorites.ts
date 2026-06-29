"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(
  listingId: string
): Promise<{ favorited: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { favorited: false, error: "errorAuth" };
  }

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { favorited: true, error: "errorGeneric" };
    }

    revalidatePath("/[locale]/favorites", "page");
    return { favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, listing_id: listingId });

  if (error) {
    return { favorited: false, error: "errorGeneric" };
  }

  revalidatePath("/[locale]/favorites", "page");
  return { favorited: true };
}

export async function getFavoriteIds(
  listingIds: string[]
): Promise<string[]> {
  if (listingIds.length === 0) return [];

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id)
    .in("listing_id", listingIds);

  return data?.map((f) => f.listing_id) ?? [];
}

export async function getFavorites() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("favorites")
    .select("listing_id, created_at, listings(*, categories(name, name_fr, name_es, name_de), listing_images(storage_path, position), responses(count))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data?.map((f) => f.listings).filter(Boolean) ?? [];
}
