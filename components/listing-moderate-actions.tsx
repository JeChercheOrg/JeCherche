"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteListing, toggleListingStatus } from "@/app/actions/listings";

interface ListingModerateActionsProps {
  locale: string;
  listingId: string;
  isFound: boolean;
  isAdmin: boolean;
  translations: {
    edit: string;
    delete: string;
    confirmDelete: string;
    cancelDelete: string;
    deleting: string;
    markFound: string;
    reopen: string;
    adminBadge: string;
  };
}

export function ListingModerateActions({
  locale,
  listingId,
  isFound,
  isAdmin,
  translations,
}: ListingModerateActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteListing(locale, listingId);
    setDeleting(false);
  }

  async function handleToggleStatus() {
    setToggling(true);
    await toggleListingStatus(locale, listingId);
    setToggling(false);
  }

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <Shield className="h-3.5 w-3.5" />
          <span className="font-medium">{translations.adminBadge}</span>
        </div>
      )}

      {confirming ? (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            {translations.confirmDelete}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? translations.deleting : translations.delete}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              {translations.cancelDelete}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/my-listings/${listingId}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {translations.edit}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStatus}
            disabled={toggling}
            className={
              isFound
                ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                : "text-green-600 hover:text-green-700 hover:bg-green-50"
            }
          >
            {isFound ? (
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isFound ? translations.reopen : translations.markFound}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {translations.delete}
          </Button>
        </div>
      )}
    </div>
  );
}
