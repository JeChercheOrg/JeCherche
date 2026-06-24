"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function updateProfile(
  locale: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const avatarFile = formData.get("avatar") as File;

  let avatarPath: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 2 * 1024 * 1024) {
      return { error: "avatarTooLarge" };
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type)) {
      return { error: "avatarFormatError" };
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", user.id)
      .single();

    if (currentProfile?.avatar_path) {
      await supabase.storage.from("avatars").remove([currentProfile.avatar_path]);
    }

    const ext = avatarFile.name.split(".").pop() || "jpg";
    const newPath = `${user.id}/avatar_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(newPath, avatarFile, { contentType: avatarFile.type });

    if (uploadError) {
      return { error: "errorGeneric" };
    }

    avatarPath = newPath;
  }

  const updateData: { avatar_path?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (avatarPath !== undefined) {
    updateData.avatar_path = avatarPath;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...updateData });

  if (updateError) {
    return { error: "errorGeneric" };
  }

  return { success: true };
}

export async function updateEmail(
  locale: string,
  newEmail: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  if (!newEmail || !newEmail.includes("@")) {
    return { error: "invalidEmail" };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { error: "errorGeneric" };
  }

  return { success: true };
}

export async function updatePassword(
  locale: string,
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "errorAuth" };
  }

  if (newPassword.length < 6) {
    return { error: "passwordTooShort" };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "wrongPassword" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: "errorGeneric" };
  }

  return { success: true };
}

export async function deleteAccount(
  locale: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("id, listing_images(storage_path)")
    .eq("user_id", user.id);

  if (listings && listings.length > 0) {
    const allImagePaths = listings.flatMap(
      (l) => (l.listing_images || []).map((img: { storage_path: string }) => img.storage_path)
    );

    if (allImagePaths.length > 0) {
      await supabase.storage.from("listing-images").remove(allImagePaths);
    }

    await supabase.from("listings").delete().eq("user_id", user.id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_path) {
    await supabase.storage.from("avatars").remove([profile.avatar_path]);
  }

  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();

  redirect(`/${locale}`);
}
