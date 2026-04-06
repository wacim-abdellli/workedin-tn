import type { ReactNode } from "react";

interface BadgeProps {
  variant?:
    | "solid"
    | "outline"
    | "subtle"
    | "dot"
    | "brand"
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info";
  color?: "success" | "warning" | "error" | "info" | "neutral" | "brand";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = "subtle",
  color,
  size = "md",
  children,
  className = "",
}: BadgeProps) {
  // Backward compat: map legacy shorthand variant names to (actualVariant, actualColor) pairs
  let actualVariant: "solid" | "outline" | "subtle" | "dot" | "brand" =
    "subtle";
  let actualColor:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    | "brand" = color || "neutral";

  if (
    variant === "success" ||
    variant === "warning" ||
    variant === "danger" ||
    variant === "info" ||
    variant === "default"
  ) {
    actualVariant = "subtle";
    actualColor =
      variant === "danger"
        ? "error"
        : variant === "default"
          ? "neutral"
          : (variant as "success" | "warning" | "info");
  } else {
    actualVariant = variant as "solid" | "outline" | "subtle" | "dot" | "brand";
  }

  const base =
    "inline-flex items-center justify-center gap-1.5 font-semibold rounded-full transition-colors";

  const sizes: Record<string, string> = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  // ── Brand variant ────────────────────────────────────────────────────────────
  if (actualVariant === "brand") {
    return (
      <span
        className={`${base} ${sizes[size]} bg-[var(--workspace-primary)] text-[var(--workspace-primary-text,#fff)] ${className}`}
      >
        {children}
      </span>
    );
  }

  // ── Dot variant ──────────────────────────────────────────────────────────────
  if (actualVariant === "dot") {
    const dotColors: Record<string, string> = {
      success: "bg-[var(--color-status-success,#10b981)]",
      warning: "bg-[var(--color-status-warning,#f59e0b)]",
      error: "bg-[var(--color-status-error,#ef4444)]",
      info: "bg-[var(--color-status-info,#3b82f6)]",
      neutral: "bg-[var(--color-text-tertiary)]",
      brand: "bg-[var(--workspace-primary)]",
    };
    return (
      <span
        className={`${base} ${sizes[size]} text-[var(--color-text-secondary)] ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[actualColor]}`}
        />
        {children}
      </span>
    );
  }

  // ── Color maps using semantic tokens ─────────────────────────────────────────
  const colorMap: Record<
    string,
    Record<"solid" | "outline" | "subtle", string>
  > = {
    success: {
      solid:
        "bg-[var(--color-status-success,#10b981)] text-white dark:bg-[var(--color-status-success,#10b981)]/90",
      outline:
        "border-2 border-[var(--color-status-success,#10b981)] text-[var(--color-status-success-text,#065f46)] dark:text-[#34d399] bg-transparent",
      subtle:
        "bg-[var(--color-status-success-bg,#d1fae5)] text-[var(--color-status-success-text,#065f46)] dark:bg-[var(--color-status-success,#10b981)]/15 dark:text-[#6ee7b7]",
    },
    warning: {
      solid:
        "bg-[var(--color-status-warning,#f59e0b)] text-white dark:bg-[var(--color-status-warning,#f59e0b)]/90",
      outline:
        "border-2 border-[var(--color-status-warning,#f59e0b)] text-[var(--color-status-warning-text,#78350f)] dark:text-[#fcd34d] bg-transparent",
      subtle:
        "bg-[var(--color-status-warning-bg,#fef3c7)] text-[var(--color-status-warning-text,#78350f)] dark:bg-[var(--color-status-warning,#f59e0b)]/15 dark:text-[#fde68a]",
    },
    error: {
      solid:
        "bg-[var(--color-status-error,#ef4444)] text-white dark:bg-[var(--color-status-error,#ef4444)]/90",
      outline:
        "border-2 border-[var(--color-status-error,#ef4444)] text-[var(--color-status-error-text,#7f1d1d)] dark:text-[#fca5a5] bg-transparent",
      subtle:
        "bg-[var(--color-status-error-bg,#fee2e2)] text-[var(--color-status-error-text,#7f1d1d)] dark:bg-[var(--color-status-error,#ef4444)]/15 dark:text-[#fca5a5]",
    },
    info: {
      solid:
        "bg-[var(--color-status-info,#3b82f6)] text-white dark:bg-[var(--color-status-info,#3b82f6)]/90",
      outline:
        "border-2 border-[var(--color-status-info,#3b82f6)] text-[var(--color-status-info-text,#1e3a8a)] dark:text-[#93c5fd] bg-transparent",
      subtle:
        "bg-[var(--color-status-info-bg,#dbeafe)] text-[var(--color-status-info-text,#1e3a8a)] dark:bg-[var(--color-status-info,#3b82f6)]/15 dark:text-[#93c5fd]",
    },
    neutral: {
      solid: "bg-[var(--color-text-tertiary)] text-white",
      outline:
        "border-2 border-[var(--color-border-strong)] text-[var(--color-text-secondary)] bg-transparent",
      subtle:
        "bg-[var(--color-background-muted,var(--color-bg-muted))] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]",
    },
    brand: {
      solid:
        "bg-[var(--workspace-primary)] text-[var(--workspace-primary-text,#fff)]",
      outline:
        "border-2 border-[var(--workspace-primary)] text-[var(--workspace-primary)] bg-transparent",
      subtle:
        "bg-[var(--workspace-primary-dim,rgba(147,51,234,0.12))] text-[var(--workspace-primary)]",
    },
  };

  const resolvedVariant = actualVariant as "solid" | "outline" | "subtle";
  const style =
    colorMap[actualColor]?.[resolvedVariant] ?? colorMap.neutral.subtle;

  return (
    <span className={`${base} ${sizes[size]} ${style} ${className}`}>
      {children}
    </span>
  );
}
