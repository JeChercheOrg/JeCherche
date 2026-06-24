"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { signup, checkDisplayName } from "@/app/actions/auth";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setNameStatus("idle");
      return;
    }

    setNameStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const result = await checkDisplayName(trimmed);
      setNameStatus(result.available ? "available" : "taken");
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [displayName]);

  function generatePassword() {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const generated = Array.from(array, (byte) => chars[byte % chars.length]).join("");
    setPassword(generated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signup(locale, email, password, displayName, window.location.origin);

    if (result.error) {
      if (result.error === "displayNameTaken") {
        setError(t("displayNameTaken"));
      } else {
        setError(t("errorGeneric"));
      }
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

      <div className="space-y-1.5">
        <Input
          label={t("displayName")}
          id="display_name"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("displayNamePlaceholder")}
          autoComplete="name"
        />
        {nameStatus === "checking" && (
          <p className="text-xs text-text-tertiary flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("displayNameChecking")}
          </p>
        )}
        {nameStatus === "available" && (
          <p className="text-xs text-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {t("displayNameAvailable")}
          </p>
        )}
        {nameStatus === "taken" && (
          <p className="text-xs text-error flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t("displayNameTaken")}
          </p>
        )}
      </div>

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

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-text-primary"
        >
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 pr-20 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-border-hover"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={generatePassword}
          className="text-xs text-primary-text hover:underline"
        >
          {t("generatePassword")}
        </button>
      </div>

      <Button type="submit" disabled={loading || nameStatus === "taken"} fullWidth size="lg">
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
