"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signup } from "@/app/actions/auth";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { CheckCircle } from "lucide-react";

export default function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function generatePassword() {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const generated = Array.from(array, (byte) => chars[byte % chars.length]).join("");
    setPassword(generated);
    setShowPassword(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signup(locale, email, password, window.location.origin);

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
          {t("signupTitle")}
        </h1>
        <p className="text-text-secondary">{t("checkEmail")}</p>
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
          {t("signupTitle")}
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

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-text-primary"
        >
          {t("password")}
        </label>
        <div className="flex gap-2">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={generatePassword}
            className="shrink-0 h-11 rounded-md"
          >
            {t("generatePassword")}
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={loading} fullWidth size="lg">
        {t("signupSubmit")}
      </Button>

      <p className="text-sm text-center text-text-secondary">
        {t("hasAccount")}{" "}
        <Link
          href={`/${locale}/login`}
          className="text-primary-text font-medium hover:underline"
        >
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
