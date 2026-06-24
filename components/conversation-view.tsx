"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendMessage, markConversationRead, getConversationDetail } from "@/app/actions/messages";
import { MessageBubble } from "@/components/message-bubble";
import { ConversationOfferCard } from "@/components/conversation-offer-card";
import { UserAvatar } from "@/components/user-avatar";
import { ArrowLeft, Send } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface OfferResponse {
  id: string;
  price: number;
  message: string;
  status: string;
  user_id: string;
  images: { storage_path: string; position: number }[];
}

interface ConversationViewProps {
  locale: string;
  conversation: {
    id: string;
    listing_id: string;
    listing_title: string;
    listing_price: number;
    other_user_name: string;
    other_user_avatar: string | null;
    other_user_id: string;
    current_user_id: string;
    is_buyer: boolean;
    response?: OfferResponse;
  };
  initialMessages: Message[];
}

export function ConversationView({
  locale,
  conversation,
  initialMessages,
}: ConversationViewProps) {
  const t = useTranslations("Messages");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [offerResponse, setOfferResponse] = useState<OfferResponse | undefined>(
    conversation.response
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  const refreshConversation = useCallback(async () => {
    const result = await getConversationDetail(conversation.id);
    if (result.conversation?.response) {
      setOfferResponse(result.conversation.response);
    }
    if (result.messages) {
      setMessages(result.messages);
    }
  }, [conversation.id]);

  const avatarUrl = conversation.other_user_avatar
    ? `${supabaseUrl}/storage/v1/object/public/avatars/${conversation.other_user_avatar}`
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markConversationRead(conversation.id).then(() => {
      window.dispatchEvent(new Event("conversation-read"));
    });
  }, [conversation.id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getConversationDetail(conversation.id);
      if (result.messages) {
        setMessages((prev) => {
          if (result.messages!.length === prev.length) return prev;
          return result.messages!;
        });
        markConversationRead(conversation.id);
      }
      if (result.conversation?.response) {
        setOfferResponse(result.conversation.response);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversation.id]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await sendMessage(conversation.id, trimmed);

    if (!result.error && result.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.message!.id)) return prev;
        return [...prev, result.message!];
      });
      setInput("");
      inputRef.current?.focus();
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="mx-auto max-w-3xl h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Link
          href={`/${locale}/messages`}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <UserAvatar
          displayName={conversation.other_user_name}
          avatarUrl={avatarUrl}
          size="sm"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {conversation.other_user_name}
          </p>
          <Link
            href={`/${locale}/listings/${conversation.listing_id}`}
            className="text-xs text-text-tertiary hover:text-primary truncate block"
          >
            {conversation.listing_title}
          </Link>
        </div>
      </div>

      {/* Offer */}
      {offerResponse && (
        <ConversationOfferCard
          response={offerResponse}
          listingId={conversation.listing_id}
          listingPrice={conversation.listing_price}
          isBuyer={conversation.is_buyer}
          locale={locale}
          onResponseChanged={refreshConversation}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-8">
            {t("noMessages")}
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            createdAt={msg.created_at}
            isOwn={msg.sender_id === conversation.current_user_id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("sendPlaceholder")}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 rounded-full bg-primary text-text-inverse p-2.5 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
