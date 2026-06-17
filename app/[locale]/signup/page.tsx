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
    <div className="mx-auto max-w-md px-4 py-16">
      <SignupForm locale={locale} />
    </div>
  );
}
