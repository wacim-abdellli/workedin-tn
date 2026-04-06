import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const base = `
            inline-flex items-center justify-center gap-2
            font-semibold tracking-[-0.01em]
            transition-all duration-150 ease-out
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            focus-visible:ring-[var(--workspace-primary)]
            disabled:cursor-not-allowed disabled:opacity-50
            min-w-[44px] min-h-[44px]
            active:scale-[0.97]
        `;

    const variants: Record<string, string> = {
      primary: `
                bg-[var(--workspace-primary-hover)]
                text-[var(--workspace-primary-text,#fff)]
                hover:bg-[var(--workspace-primary-active)]
                active:bg-[var(--workspace-primary-active)]
                shadow-[0_2px_8px_color-mix(in_srgb,var(--workspace-primary-hover)_35%,transparent)]
                hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--workspace-primary-hover)_40%,transparent)]
                hover:-translate-y-px
            `,
      accent: `
                bg-[var(--workspace-secondary,var(--amber-600))]
                text-white
                hover:bg-[var(--workspace-secondary-hover,var(--amber-700))]
                shadow-[0_2px_8px_color-mix(in_srgb,var(--workspace-secondary,#d97706)_35%,transparent)]
                hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--workspace-secondary,#d97706)_40%,transparent)]
                hover:-translate-y-px
            `,
      secondary: `
                bg-[var(--color-background-elevated,#fff)]
                text-[var(--color-text-primary)]
                border border-[var(--color-border-default)]
                hover:bg-[var(--color-background-muted)]
                hover:border-[var(--color-border-strong)]
                shadow-[0_1px_3px_rgba(0,0,0,0.08)]
            `,
      outline: `
                bg-transparent
                text-[var(--workspace-primary-hover)]
                border-2 border-[var(--workspace-primary-hover)]
                hover:bg-[var(--workspace-primary-hover)]
                hover:text-[var(--workspace-primary-text,#fff)]
                hover:-translate-y-px
            `,
      ghost: `
                bg-transparent
                text-[var(--color-text-secondary)]
                hover:bg-[var(--workspace-primary-dim,rgba(147,51,234,0.10))]
                hover:text-[var(--workspace-primary)]
            `,
      danger: `
                bg-[var(--color-status-error,#ef4444)]
                text-white
                hover:bg-[#dc2626]
                active:bg-[#b91c1c]
                shadow-[0_2px_8px_rgba(239,68,68,0.3)]
                hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)]
                hover:-translate-y-px
            `,
    };

    const sizes: Record<string, string> = {
      xs: "px-3 py-1.5 text-xs rounded-lg",
      sm: "px-4 py-2 text-sm rounded-lg",
      md: "px-5 py-2.5 text-sm rounded-xl",
      lg: "px-7 py-3 text-base rounded-xl",
      xl: "px-9 py-4 text-lg rounded-2xl",
    };

    const loaderSizes: Record<string, string> = {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
      xl: "w-6 h-6",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={`${loaderSizes[size]} animate-spin`} />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
