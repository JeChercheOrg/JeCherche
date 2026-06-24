import { setRequestLocale } from "next-intl/server";
import ForgotPasswordForm from "./forgot-password-form";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm locale={locale} />
      </div>
    </div>
  );
}
