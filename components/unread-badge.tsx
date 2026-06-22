"use client";

import { useState, useEffect, useCallback } from "react";
import { getUnreadCount } from "@/app/actions/messages";

const POLL_INTERVAL = 30000;

export function UnreadBadge({
  initialCount,
}: {
  initialCount: number;
  currentUserId: string;
}) {
  const [count, setCount] = useState(initialCount);

  const refresh = useCallback(async () => {
    const newCount = await getUnreadCount();
    setCount(newCount);
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    window.addEventListener("conversation-read", refresh);
    return () => window.removeEventListener("conversation-read", refresh);
  }, [refresh]);

  if (count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-error text-text-inverse text-[10px] font-bold px-1">
      {count > 99 ? "99+" : count}
    </span>
  );
}
