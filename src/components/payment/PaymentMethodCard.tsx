import { CheckCircle2, Clock3, ExternalLink, Trash2 } from "lucide-react";
import { PaymentLogo, type PaymentProviderId } from "./PaymentLogo";

export type PaymentMethodStatus = "live" | "soon" | "default";

type PaymentMethodCardProps = {
  id: PaymentProviderId;
  name: string;
  description: string;
  status?: PaymentMethodStatus;
  /** Highlight the card with an active border/glow (e.g. currently selected gateway) */
  active?: boolean;
  /** Greyed-out, non-interactive (Coming Soon) */
  disabled?: boolean;
  /** Selected ring (for selector contexts) */
  selected?: boolean;
  /** Fires when the user clicks the external wallet icon button */
  onWallet?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
  className?: string;
};

type StatusCfg = { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> };

const CARD_THEME: Record<PaymentProviderId, {
  active: string;
  selected: string;
  hover: string;
  disabled: string;
  walletHover: string;
}> = {
  dhmad: {
    active: "border-violet-500/50 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]",
    selected: "ring-2 ring-violet-400/35",
    hover: "hover:border-violet-400/40 hover:bg-violet-500/[0.06]",
    disabled: "cursor-not-allowed border-violet-500/20 bg-violet-500/[0.045]",
    walletHover: "hover:border-violet-400/50",
  },
  flouci: {
    active: "border-amber-400/55 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.14)]",
    selected: "ring-2 ring-amber-400/35",
    hover: "hover:border-amber-300/45 hover:bg-amber-500/[0.07]",
    disabled: "cursor-not-allowed border-amber-500/25 bg-amber-500/[0.05]",
    walletHover: "hover:border-amber-300/50",
  },
  d17: {
    active: "border-cyan-400/55 bg-sky-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.14)]",
    selected: "ring-2 ring-cyan-300/35",
    hover: "hover:border-cyan-300/45 hover:bg-sky-500/[0.07]",
    disabled: "cursor-not-allowed border-cyan-400/25 bg-sky-500/[0.05]",
    walletHover: "hover:border-cyan-300/50",
  },
  bank: {
    active: "border-blue-500/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.14)]",
    selected: "ring-2 ring-blue-400/35",
    hover: "hover:border-blue-400/45 hover:bg-blue-500/[0.06]",
    disabled: "cursor-not-allowed border-blue-500/25 bg-blue-500/[0.05]",
    walletHover: "hover:border-blue-400/50",
  },
};

const LIVE_STATUS: StatusCfg = {
  label: "LIVE",
  cls: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25",
  Icon: CheckCircle2,
};

const SOON_STATUS_BY_ID: Record<PaymentProviderId, StatusCfg> = {
  dhmad: {
    label: "SOON",
    cls: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25",
    Icon: Clock3,
  },
  flouci: {
    label: "SOON",
    cls: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25",
    Icon: Clock3,
  },
  d17: {
    label: "SOON",
    cls: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/25",
    Icon: Clock3,
  },
  bank: {
    label: "SOON",
    cls: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/25",
    Icon: Clock3,
  },
};

const DEFAULT_STATUS_BY_ID: Record<PaymentProviderId, StatusCfg> = {
  dhmad: {
    label: "DEFAULT",
    cls: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25",
    Icon: CheckCircle2,
  },
  flouci: {
    label: "DEFAULT",
    cls: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25",
    Icon: CheckCircle2,
  },
  d17: {
    label: "DEFAULT",
    cls: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/25",
    Icon: CheckCircle2,
  },
  bank: {
    label: "DEFAULT",
    cls: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/25",
    Icon: CheckCircle2,
  },
};

function getStatusCfg(status: PaymentMethodStatus, id: PaymentProviderId): StatusCfg {
  if (status === "live") return LIVE_STATUS;
  if (status === "soon") return SOON_STATUS_BY_ID[id];
  return DEFAULT_STATUS_BY_ID[id];
}

export function PaymentMethodCard({
  id,
  name,
  description,
  status,
  active = false,
  disabled = false,
  selected = false,
  onWallet,
  onDelete,
  onSelect,
  className = "",
}: PaymentMethodCardProps) {
  const cfg = status ? getStatusCfg(status, id) : null;
  const theme = CARD_THEME[id];

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200",
        active ? theme.active : "border-white/10 bg-[var(--color-bg-elevated)]",
        selected ? theme.selected : "",
        disabled
          ? theme.disabled
          : onSelect
          ? ["cursor-pointer", theme.hover].join(" ")
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect && !disabled ? 0 : undefined}
      aria-disabled={disabled}
      onClick={() => { if (!disabled) onSelect?.(); }}
      onKeyDown={(e) => {
        if (!disabled && onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Top gloss line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex items-center gap-4">
        <PaymentLogo id={id} size="md" muted={disabled} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{name}</h3>
            {cfg && (
              <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", cfg.cls].join(" ")}>
                <cfg.Icon className="h-3 w-3" />
                {cfg.label}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
            {description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          {onWallet && !disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onWallet(); }}
              className={[
                "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]",
                theme.walletHover,
              ].join(" ")}
              aria-label={`Open ${name} wallet`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Remove ${name}? This action cannot be undone.`)) {
                  onDelete();
                }
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)] transition hover:border-red-400/50 hover:text-red-400"
              aria-label={`Remove ${name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



