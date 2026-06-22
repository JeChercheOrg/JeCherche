"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { acceptListing } from "@/app/actions/responses";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";

export function ListingActions({
  locale,
  listingId,
}: {
  locale: string;
  listingId: string;
}) {
  const t = useTranslations("Responses");
  const router = useRouter();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await acceptListing(locale, listingId);
      if (result?.error) {
        setError(t(result.error));
        setConfirming(false);
      } else {
        showToast(t("sellSuccess"));
        router.refresh();
      }
    } catch {
      setError(t("errorGeneric"));
      setConfirming(false);
    }
    setLoading(false);
  }

  function handleMakeOffer() {
    const el = document.getElementById("response-price");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus(), 500);
    }
  }

  return (
    <div className="space-y-2">
      {confirming ? (
        <>
          <p className="text-sm text-text-secondary">{t("confirmSellMessage")}</p>
          <Button onClick={handleAccept} disabled={loading} fullWidth>
            {loading ? t("submitting") : t("confirmSell")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setConfirming(false)}
            fullWidth
          >
            {t("cancelSell")}
          </Button>
        </>
      ) : (
        <>
          <Button onClick={handleAccept} fullWidth>
            {t("sellNow")}
          </Button>
          <Button variant="secondary" onClick={handleMakeOffer} fullWidth>
            {t("makeOfferButton")}
          </Button>
        </>
      )}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
