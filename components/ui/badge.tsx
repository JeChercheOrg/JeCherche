import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type BadgeVariant = "default" | "primary" | "secondary" | "success";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-background text-text-secondary border border-border",
  primary: "bg-primary-light text-primary-text",
  secondary: "bg-secondary-light text-secondary",
  success: "bg-tertiary-light text-green-800",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
export { Badge };
export type { BadgeProps };
