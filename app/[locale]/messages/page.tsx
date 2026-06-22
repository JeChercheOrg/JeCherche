import { getTranslations, setRequestLocale } from "next-intl/server";
import { getConversations } from "@/app/actions/messages";
import { redirect } from "next/navigation";
import { ConversationPreviewCard } from "@/components/conversation-preview-card";
import { MessageCircle } from "lucide-react";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Messages");
  const result = await getConversations();

  if (result.error === "errorAuth") {
    redirect(`/${locale}/login`);
  }

  const conversations = result.conversations || [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl font-bold text-text-primary mb-6">
        {t("inbox")}
      </h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageCircle className="h-10 w-10 text-text-tertiary mb-3" />
          <p className="text-sm text-text-tertiary">
            {t("noConversations")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <ConversationPreviewCard
              key={conv.id}
              conversation={conv}
              locale={locale}
              supabaseUrl={supabaseUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
