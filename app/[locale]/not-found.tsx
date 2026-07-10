"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("Errors");
  const locale = useLocale();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <FileQuestion className="h-12 w-12 text-text-tertiary" />
      <h1 className="mt-6 text-2xl font-bold text-text-primary">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("notFoundText")}</p>
      <Link
        href={`/${locale}`}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover transition-colors"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
