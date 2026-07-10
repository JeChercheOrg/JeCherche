"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-error" />
      <h1 className="mt-6 text-2xl font-bold text-text-primary">
        {t("errorTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("errorText")}</p>
      <button
        onClick={() => unstable_retry()}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary-hover transition-colors"
      >
        {t("retry")}
      </button>
    </div>
  );
}
