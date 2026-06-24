"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/app/actions/auth";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { CheckCircle } from "lucide-react";

export default function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await requestPasswordReset(email, window.location.origin, locale);

    if (result.error) {
      setError(t("errorGeneric"));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-tertiary-light flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">
          {t("forgotPasswordTitle")}
        </h1>
        <p className="text-text-secondary">{t("forgotPasswordSent")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <Logo href={`/${locale}`} />
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          {t("forgotPasswordTitle")}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("forgotPasswordSubtitle")}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-error-light border border-error/20 px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <Input
        label={t("email")}
        id="email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <Button type="submit" disabled={loading} fullWidth size="lg">
        {t("forgotPasswordSubmit")}
      </Button>

      <p className="text-sm text-center text-text-secondary">
        <Link
          href={`/${locale}/login`}
          className="text-primary-text font-medium hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
