import { setRequestLocale } from "next-intl/server";
import LoginForm from "./login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-8 shadow-sm">
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
