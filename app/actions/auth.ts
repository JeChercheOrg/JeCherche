"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function logout(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function signup(
  locale: string,
  email: string,
  password: string,
  origin: string
) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/${locale}/auth/confirm`,
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
