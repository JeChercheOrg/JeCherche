import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-primary font-semibold hover:bg-primary-hover active:scale-[0.98]",
  secondary:
    "bg-surface text-text-primary border border-border font-medium hover:border-border-hover hover:bg-background",
  ghost:
    "bg-transparent text-text-secondary font-medium hover:bg-background hover:text-text-primary",
  destructive:
    "bg-error text-text-inverse font-semibold hover:bg-red-700 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm rounded-md min-h-[44px] sm:min-h-0 sm:py-1.5",
  md: "px-5 py-2.5 text-sm rounded-full",
  lg: "px-6 py-3 text-base rounded-full",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps };
