import Image from "next/image";

const AVATAR_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7",
  "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
  "#009688", "#4CAF50", "#8BC34A", "#FF9800",
  "#FF5722", "#795548", "#607D8B",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SIZES = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-lg",
  lg: "w-20 h-20 text-2xl",
} as const;

const PX_SIZES = { sm: 32, md: 48, lg: 80 } as const;

interface UserAvatarProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
}

export function UserAvatar({ displayName, avatarUrl, size = "sm" }: UserAvatarProps) {
  const label = displayName || "?";
  const initial = label.charAt(0).toUpperCase();
  const px = PX_SIZES[size];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName || "Avatar"}
        width={px}
        height={px}
        className={`${SIZES[size].split(" ").slice(0, 2).join(" ")} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center text-white font-medium select-none`}
      style={{ backgroundColor: getAvatarColor(label) }}
    >
      {initial}
    </div>
  );
}
