import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";

interface ConversationPreviewCardProps {
  conversation: {
    id: string;
    listing_title: string;
    other_user_name: string;
    other_user_avatar: string | null;
    other_user_id: string;
    last_message: string | null;
    last_message_at: string;
    has_unread: boolean;
  };
  locale: string;
  supabaseUrl: string;
}

export function ConversationPreviewCard({
  conversation,
  locale,
  supabaseUrl,
}: ConversationPreviewCardProps) {
  const avatarUrl = conversation.other_user_avatar
    ? `${supabaseUrl}/storage/v1/object/public/avatars/${conversation.other_user_avatar}`
    : null;

  const timeAgo = formatRelativeTime(conversation.last_message_at);

  return (
    <Link
      href={`/${locale}/messages/${conversation.id}`}
      className={`flex items-center gap-3 rounded-xl border bg-surface p-4 hover:border-border-hover hover:bg-surface-hover transition-colors ${conversation.has_unread ? "border-primary/40" : "border-border"}`}
    >
      <UserAvatar
        displayName={conversation.other_user_name}
        avatarUrl={avatarUrl}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${conversation.has_unread ? "font-semibold text-text-primary" : "font-medium text-text-primary"}`}>
            {conversation.other_user_name}
          </p>
          <span className="text-xs text-text-tertiary whitespace-nowrap shrink-0">
            {timeAgo}
          </span>
        </div>
        <p className="text-xs text-text-tertiary truncate mt-0.5">
          {conversation.listing_title}
        </p>
        {conversation.last_message && (
          <p className={`text-sm truncate mt-1 ${conversation.has_unread ? "font-medium text-text-primary" : "text-text-secondary"}`}>
            {conversation.last_message}
          </p>
        )}
      </div>
      {conversation.has_unread && (
        <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString();
}
