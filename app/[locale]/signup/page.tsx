import { setRequestLocale } from "next-intl/server";
import SignupForm from "./signup-form";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-8 shadow-sm">
        <SignupForm locale={locale} />
      </div>
    </div>
  );
}
