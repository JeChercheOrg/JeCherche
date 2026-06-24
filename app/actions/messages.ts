"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrCreateConversation(
  locale: string,
  responseId: string
): Promise<{ conversationId?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("response_id", responseId)
    .single();

  if (existing) {
    return { conversationId: existing.id };
  }

  const { data: response } = await supabase
    .from("responses")
    .select("id, user_id, listing_id, listings(user_id)")
    .eq("id", responseId)
    .single();

  if (!response || !response.listings) {
    return { error: "errorGeneric" };
  }

  const listings = response.listings as unknown as { user_id: string };
  const buyerId = listings.user_id;
  const sellerId = response.user_id;

  if (user.id !== buyerId && user.id !== sellerId) {
    return { error: "errorGeneric" };
  }

  const { data: conversation, error: insertError } = await supabase
    .from("conversations")
    .insert({
      listing_id: response.listing_id,
      response_id: responseId,
      buyer_id: buyerId,
      seller_id: sellerId,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: retry } = await supabase
        .from("conversations")
        .select("id")
        .eq("response_id", responseId)
        .single();
      if (retry) return { conversationId: retry.id };
    }
    return { error: "errorGeneric" };
  }

  return { conversationId: conversation.id };
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ error?: string; message?: { id: string; sender_id: string; content: string; created_at: string } }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "errorEmpty" };
  }
  if (trimmed.length > 2000) {
    return { error: "errorTooLong" };
  }

  const { data, error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: trimmed,
  }).select("id, sender_id, content, created_at").single();

  if (insertError || !data) {
    return { error: "errorGeneric" };
  }

  return { message: data };
}

export async function getConversations(): Promise<{
  conversations?: {
    id: string;
    listing_id: string;
    listing_title: string;
    other_user_name: string;
    other_user_avatar: string | null;
    other_user_id: string;
    last_message: string | null;
    last_message_at: string;
    has_unread: boolean;
  }[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, buyer_id, seller_id, created_at, listings(title), buyer:profiles!conversations_buyer_id_fkey(display_name, avatar_path), seller:profiles!conversations_seller_id_fkey(display_name, avatar_path)"
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!conversations) {
    return { conversations: [] };
  }

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const isBuyer = conv.buyer_id === user.id;
      const otherProfile = isBuyer
        ? (conv.seller as unknown as { display_name: string | null; avatar_path: string | null })
        : (conv.buyer as unknown as { display_name: string | null; avatar_path: string | null });

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: readRecord } = await supabase
        .from("conversation_reads")
        .select("last_read_at")
        .eq("conversation_id", conv.id)
        .eq("user_id", user.id)
        .single();

      let hasUnread = false;
      if (lastMsg) {
        let unreadQuery = supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id);

        if (readRecord) {
          unreadQuery = unreadQuery.gt("created_at", readRecord.last_read_at);
        }

        const { count } = await unreadQuery;
        hasUnread = (count ?? 0) > 0;
      }

      return {
        id: conv.id,
        listing_id: conv.listing_id,
        listing_title: (conv.listings as unknown as { title: string })?.title || "",
        other_user_name: otherProfile?.display_name || "?",
        other_user_avatar: otherProfile?.avatar_path || null,
        other_user_id: isBuyer ? conv.seller_id : conv.buyer_id,
        last_message: lastMsg?.content || null,
        last_message_at: lastMsg?.created_at || conv.created_at,
        has_unread: hasUnread,
      };
    })
  );

  result.sort(
    (a, b) =>
      new Date(b.last_message_at).getTime() -
      new Date(a.last_message_at).getTime()
  );

  return { conversations: result };
}

export async function getConversationDetail(conversationId: string): Promise<{
  conversation?: {
    id: string;
    listing_id: string;
    listing_title: string;
    listing_price: number;
    other_user_name: string;
    other_user_avatar: string | null;
    other_user_id: string;
    current_user_id: string;
    is_buyer: boolean;
    response?: {
      id: string;
      price: number;
      message: string;
      status: string;
      user_id: string;
      images: { storage_path: string; position: number }[];
    };
  };
  messages?: {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "errorAuth" };
  }

  const { data: conv } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, buyer_id, seller_id, response_id, listings(title, price), buyer:profiles!conversations_buyer_id_fkey(display_name, avatar_path), seller:profiles!conversations_seller_id_fkey(display_name, avatar_path)"
    )
    .eq("id", conversationId)
    .single();

  if (!conv) {
    return { error: "errorGeneric" };
  }

  if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
    return { error: "errorGeneric" };
  }

  const isBuyer = conv.buyer_id === user.id;
  const otherProfile = isBuyer
    ? (conv.seller as unknown as { display_name: string | null; avatar_path: string | null })
    : (conv.buyer as unknown as { display_name: string | null; avatar_path: string | null });

  const listingData = conv.listings as unknown as { title: string; price: number };

  let responseData: {
    id: string;
    price: number;
    message: string;
    status: string;
    user_id: string;
    images: { storage_path: string; position: number }[];
  } | undefined;

  if (conv.response_id) {
    const { data: resp } = await supabase
      .from("responses")
      .select("id, price, message, status, user_id, response_images(storage_path, position)")
      .eq("id", conv.response_id)
      .single();

    if (resp) {
      responseData = {
        id: resp.id,
        price: resp.price,
        message: resp.message,
        status: resp.status,
        user_id: resp.user_id,
        images: (resp.response_images as { storage_path: string; position: number }[]) || [],
      };
    }
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return {
    conversation: {
      id: conv.id,
      listing_id: conv.listing_id,
      listing_title: listingData?.title || "",
      listing_price: listingData?.price || 0,
      other_user_name: otherProfile?.display_name || "?",
      other_user_avatar: otherProfile?.avatar_path || null,
      other_user_id: isBuyer ? conv.seller_id : conv.buyer_id,
      current_user_id: user.id,
      is_buyer: isBuyer,
      response: responseData,
    },
    messages: messages || [],
  };
}

export async function markConversationRead(
  conversationId: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("conversation_reads")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" }
    );
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (!conversations || conversations.length === 0) return 0;

  let unreadCount = 0;

  for (const conv of conversations) {
    const { data: readRecord } = await supabase
      .from("conversation_reads")
      .select("last_read_at")
      .eq("conversation_id", conv.id)
      .eq("user_id", user.id)
      .single();

    let query = supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .neq("sender_id", user.id);

    if (readRecord) {
      query = query.gt("created_at", readRecord.last_read_at);
    }

    const { count } = await query;
    if (count && count > 0) unreadCount += count;
  }

  return unreadCount;
}
