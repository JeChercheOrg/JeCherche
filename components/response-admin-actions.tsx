"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Shield } from "lucide-react";
import { deleteResponse } from "@/app/actions/responses";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";

export function ResponseAdminActions({
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
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteResponse(locale, listingId, responseId);
      if (result?.error) {
        setError(t(result.error));
        setDeleting(false);
      } else {
        showToast(t("offerDeleted"));
        router.refresh();
      }
    } catch {
      setError(t("errorGeneric"));
      setDeleting(false);
    }
  }

  return (
    <div className="pt-2 space-y-2 border-t border-border">
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <Shield className="h-3.5 w-3.5" />
        <span className="font-medium">{t("adminAction")}</span>
      </div>

      {confirming ? (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            {t("confirmDeleteOffer")}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("deleting") : t("deleteOffer")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              {t("cancelDelete")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          {t("deleteOffer")}
        </Button>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
