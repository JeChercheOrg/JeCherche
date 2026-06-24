"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updatePasswordWithToken } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    const result = await updatePasswordWithToken(locale, password);

    if (result?.error) {
      setError(t("errorGeneric"));
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
          {t("resetPasswordTitle")}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("resetPasswordSubtitle")}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-error-light border border-error/20 px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-text-primary">
          {t("newPassword")}
        </label>
        <div className="relative">
          <input
            id="new-password"
            name="new-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 pr-12 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-text-primary">
          {t("confirmPassword")}
        </label>
        <input
          id="confirm-password"
          name="confirm-password"
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
        />
      </div>

      <Button type="submit" disabled={loading} fullWidth size="lg">
        {t("resetPasswordSubmit")}
      </Button>
    </form>
  );
}
