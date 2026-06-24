import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import AccountForm from "./account-form";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("Account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_path")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.from("profiles").upsert({ id: user.id });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {t("pageTitle")} — {profile?.display_name}
      </h1>
      <AccountForm
        locale={locale}
        email={user.email || ""}
        avatarPath={profile?.avatar_path || null}
      />
    </div>
  );
}
