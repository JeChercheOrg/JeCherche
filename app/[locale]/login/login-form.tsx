"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { login } from "@/app/actions/auth";
import Link from "next/link";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {t("loginSubmit")}
      </button>

      <p className="text-sm text-center text-gray-600">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/signup`}
          className="text-blue-600 hover:underline"
        >
          {t("signup")}
        </Link>
      </p>
    </form>
  );
}
