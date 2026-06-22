interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isOwn: boolean;
}

export function MessageBubble({ content, createdAt, isOwn }: MessageBubbleProps) {
  const date = new Date(createdAt);
  const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isOwn
            ? "bg-primary text-text-inverse rounded-br-md"
            : "bg-surface-alt border border-border text-text-primary rounded-bl-md"
          }`}
      >
        <p className="text-sm whitespace-pre-line leading-relaxed">{content}</p>
        <p
          className={`text-[10px] mt-1 ${isOwn ? "text-text-inverse/70" : "text-text-tertiary"
            }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
