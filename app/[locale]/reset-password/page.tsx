import { setRequestLocale } from "next-intl/server";
import ResetPasswordForm from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <ResetPasswordForm locale={locale} />
      </div>
    </div>
  );
}
