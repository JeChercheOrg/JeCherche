"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { login } from "@/app/actions/auth";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(locale, email, password);

    if (result?.error) {
      setError(t("errorInvalidCredentials"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <Logo href={`/${locale}`} />
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          {t("loginTitle")}
        </h1>
      </div>

      {error && (
        <div className="rounded-md bg-error-light border border-error/20 px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <Input
        label={t("email")}
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <Input
        label={t("password")}
        id="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      <Button type="submit" disabled={loading} fullWidth size="lg">
        {t("loginSubmit")}
      </Button>

      <p className="text-sm text-center text-text-secondary">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/signup`}
          className="text-primary-text font-medium hover:underline"
        >
          {t("signup")}
        </Link>
      </p>
    </form>
  );
}
