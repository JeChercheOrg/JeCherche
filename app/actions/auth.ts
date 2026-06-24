"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function checkDisplayName(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return { available: false, reason: "tooShort" };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("display_name", trimmed)
    .limit(1);

  return { available: !data || data.length === 0 };
}

export async function logout(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function signup(
  locale: string,
  email: string,
  password: string,
  displayName: string,
  origin: string
) {
  const supabase = await createClient();

  const trimmedName = displayName.trim();
  if (!trimmedName) {
    return { error: "displayNameRequired" };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("display_name", trimmedName)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "displayNameTaken" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/${locale}/auth/confirm`,
      data: { display_name: trimmedName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function login(
  locale: string,
  email: string,
  password: string,
  redirectTo?: string
) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : `/${locale}`);
}

export async function requestPasswordReset(email: string, origin: string, locale: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${locale}/auth/confirm?type=recovery`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updatePasswordWithToken(locale: string, newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  redirect(`/${locale}`);
}
