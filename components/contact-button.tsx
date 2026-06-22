"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getOrCreateConversation } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function ContactButton({
  locale,
  responseId,
}: {
  locale: string;
  responseId: string;
}) {
  const t = useTranslations("Messages");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await getOrCreateConversation(locale, responseId);

    if (result.conversationId) {
      router.push(`/${locale}/messages/${result.conversationId}`);
    } else {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {loading ? t("contacting") : t("contact")}
    </Button>
  );
}
