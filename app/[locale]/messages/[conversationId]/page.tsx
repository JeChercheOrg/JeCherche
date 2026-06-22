import { setRequestLocale } from "next-intl/server";
import { getConversationDetail } from "@/app/actions/messages";
import { redirect, notFound } from "next/navigation";
import { ConversationView } from "@/components/conversation-view";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const { locale, conversationId } = await params;
  setRequestLocale(locale);

  const result = await getConversationDetail(conversationId);

  if (result.error === "errorAuth") {
    redirect(`/${locale}/login`);
  }

  if (result.error || !result.conversation) {
    notFound();
  }

  return (
    <ConversationView
      locale={locale}
      conversation={result.conversation}
      initialMessages={result.messages || []}
    />
  );
}
