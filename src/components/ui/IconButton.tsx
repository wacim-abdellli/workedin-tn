import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: "ghost" | "filled" | "outline" | "danger" | "brand";
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
  isLoading?: boolean;
}

const ghostVariant =
  "text-[var(--color-text-secondary)] " +
  "hover:bg-[var(--workspace-primary-dim,rgba(147,51,234,0.08))] " +
  "hover:text-[var(--workspace-primary)] " +
  "dark:text-[var(--color-text-tertiary)]";

const filledVariant =
  "bg-[var(--color-background-elevated)] " +
  "border border-[var(--color-border-default)] " +
  "text-[var(--color-text-primary)] " +
  "hover:border-[var(--color-border-strong)] " +
  "hover:bg-[var(--color-background-muted)] " +
  "shadow-sm";

const outlineVariant =
  "border-2 border-[var(--color-border-subtle)] " +
  "text-[var(--color-text-secondary)] " +
  "hover:border-[var(--workspace-primary)] " +
  "hover:text-[var(--workspace-primary)]";

const dangerVariant =
  "text-[var(--color-text-tertiary)] " +
  "hover:bg-[var(--color-status-error-bg,#fee2e2)] " +
  "hover:text-[var(--color-status-error,#ef4444)] " +
  "dark:hover:bg-[rgba(239,68,68,0.12)]";

const brandVariant =
  "bg-[var(--workspace-primary)] " +
  "text-[var(--workspace-primary-text,#fff)] " +
  "hover:bg-[var(--workspace-primary-hover)] " +
  "shadow-[0_2px_8px_color-mix(in_srgb,var(--workspace-primary)_30%,transparent)]";

const variantClasses: Record<string, string> = {
  ghost: ghostVariant,
  filled: filledVariant,
  outline: outlineVariant,
  danger: dangerVariant,
  brand: brandVariant,
};

const activeClasses: Record<string, string> = {
  ghost:
    "bg-[var(--workspace-primary-dim,rgba(147,51,234,0.1))] text-[var(--workspace-primary)]",
  filled: "border-[var(--workspace-primary)] text-[var(--workspace-primary)]",
  outline: "border-[var(--workspace-primary)] text-[var(--workspace-primary)]",
  danger:
    "bg-[var(--color-status-error-bg,#fee2e2)] text-[var(--color-status-error,#ef4444)]",
  brand: "bg-[var(--workspace-primary-hover)]",
};

const sizeClasses: Record<string, string> = {
  sm: "w-9 h-9 min-h-[36px] min-w-[36px]",
  md: "w-10 h-10 min-h-[40px] min-w-[40px]",
  lg: "w-12 h-12 min-h-[48px] min-w-[48px]",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      className,
      variant = "ghost",
      size = "md",
      isActive,
      isLoading,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex items-center justify-center rounded-xl transition-all duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-primary)] focus-visible:ring-offset-2",
          "active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          sizeClasses[size],
          variantClasses[variant],
          isActive && activeClasses[variant],
          className,
        )}
        aria-label={label}
        aria-pressed={isActive}
        disabled={disabled || isLoading}
        title={label}
        {...props}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
export default IconButton;
