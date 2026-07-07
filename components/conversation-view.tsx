"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  sendMessage,
  markConversationRead,
  getOlderMessages,
  pollNewMessages,
} from "@/app/actions/messages";
import { MessageBubble } from "@/components/message-bubble";
import { ConversationOfferCard } from "@/components/conversation-offer-card";
import { UserAvatar } from "@/components/user-avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

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
  initialHasOlderMessages: boolean;
}

export function ConversationView({
  locale,
  conversation,
  initialMessages,
  initialHasOlderMessages,
}: ConversationViewProps) {
  const t = useTranslations("Messages");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [offerResponse, setOfferResponse] = useState<OfferResponse | undefined>(
    conversation.response
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(initialHasOlderMessages);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDone = useRef(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  const refreshConversation = useCallback(async () => {
    const result = await pollNewMessages(
      conversation.id,
      messages.length > 0 ? messages[messages.length - 1].created_at : ""
    );
    if (result.response) {
      setOfferResponse(result.response);
    }
    if (result.newMessages && result.newMessages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = result.newMessages!.filter((m) => !existingIds.has(m.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    }
  }, [conversation.id, messages]);

  const avatarUrl = conversation.other_user_avatar
    ? `${supabaseUrl}/storage/v1/object/public/avatars/${conversation.other_user_avatar}`
    : null;

  useEffect(() => {
    if (!initialScrollDone.current) {
      messagesEndRef.current?.scrollIntoView();
      requestAnimationFrame(() => {
        initialScrollDone.current = true;
      });
    }
  }, []);

  useEffect(() => {
    markConversationRead(conversation.id).then(() => {
      window.dispatchEvent(new Event("conversation-read"));
    });
  }, [conversation.id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const lastTimestamp =
        messages.length > 0 ? messages[messages.length - 1].created_at : "";
      if (!lastTimestamp) return;

      const result = await pollNewMessages(conversation.id, lastTimestamp);
      if (result.newMessages && result.newMessages.length > 0) {
        const container = scrollContainerRef.current;
        const isAtBottom =
          container &&
          container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = result.newMessages!.filter((m) => !existingIds.has(m.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });

        if (isAtBottom) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }

        markConversationRead(conversation.id);
      }
      if (result.response) {
        setOfferResponse(result.response);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversation.id, messages]);

  async function handleLoadOlder() {
    if (loadingOlder || !hasOlderMessages || messages.length === 0) return;
    setLoadingOlder(true);

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const result = await getOlderMessages(
      conversation.id,
      messages[0].created_at
    );

    if (result.messages && result.messages.length > 0) {
      setMessages((prev) => [...result.messages!, ...prev]);
      setHasOlderMessages(result.hasMore);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } else {
      setHasOlderMessages(false);
    }

    setLoadingOlder(false);
  }

  function handleScroll() {
    if (!initialScrollDone.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 50 && hasOlderMessages && !loadingOlder) {
      handleLoadOlder();
    }
  }

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
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
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
    <div className="mx-auto max-w-3xl h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col">
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
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {hasOlderMessages && (
          <div className="text-center py-2">
            {loadingOlder ? (
              <Loader2 className="h-5 w-5 animate-spin text-text-tertiary mx-auto" />
            ) : (
              <button
                onClick={handleLoadOlder}
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                {t("loadOlderMessages")}
              </button>
            )}
          </div>
        )}
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
            rows={2}
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
