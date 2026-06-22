"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { acceptResponse, rejectResponse } from "@/app/actions/responses";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";

export function ResponseActions({
  locale,
  listingId,
  responseId,
}: {
  locale: string;
  listingId: string;
  responseId: string;
}) {
  const t = useTranslations("Responses");
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading("accept");
    setError(null);
    try {
      const result = await acceptResponse(locale, listingId, responseId);
      if (result?.error) {
        setError(t(result.error));
      } else {
        showToast(t("offerAccepted"));
        router.refresh();
      }
    } catch {
      setError(t("errorGeneric"));
    }
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    try {
      const result = await rejectResponse(locale, listingId, responseId);
      if (result?.error) {
        setError(t(result.error));
      } else {
        showToast(t("offerRejected"));
        router.refresh();
      }
    } catch {
      setError(t("errorGeneric"));
    }
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={loading !== null}
      >
        {loading === "accept" ? t("submitting") : t("accept")}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleReject}
        disabled={loading !== null}
      >
        {loading === "reject" ? t("submitting") : t("reject")}
      </Button>
      {error && <p className="text-xs text-error self-center">{error}</p>}
    </div>
  );
}
