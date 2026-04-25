import { Building2, CreditCard, ShieldCheck, WalletCards } from "lucide-react";

// "bank" added for generic bank-transfer payout entries (not a gateway provider)
export type PaymentProviderId = "dhmad" | "flouci" | "d17" | "bank";

type PaymentLogoMeta = {
  id: PaymentProviderId;
  name: string;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const PAYMENT_LOGOS: Record<PaymentProviderId, PaymentLogoMeta> = {
  dhmad: {
    id: "dhmad",
    name: "Dhmad Escrow",
    bgClass: "bg-gradient-to-br from-violet-500 to-indigo-700",
    borderClass: "border-violet-400/35",
    iconClass: "text-white/95",
    Icon: ShieldCheck,
  },
  flouci: {
    id: "flouci",
    name: "Flouci",
    bgClass: "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600",
    borderClass: "border-amber-300/35",
    iconClass: "text-white/95",
    Icon: WalletCards,
  },
  d17: {
    id: "d17",
    name: "D17",
    bgClass: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-800",
    borderClass: "border-cyan-300/35",
    iconClass: "text-white/95",
    Icon: Building2,
  },
  bank: {
    id: "bank",
    name: "Bank Transfer",
    bgClass: "bg-gradient-to-br from-blue-600 to-blue-900",
    borderClass: "border-blue-500/30",
    iconClass: "text-white/90",
    Icon: CreditCard,
  },
};

type PaymentLogoProps = {
  id: PaymentProviderId;
  size?: "sm" | "md" | "lg";
  muted?: boolean;
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<PaymentLogoProps["size"]>, string> = {
  sm: "h-9 w-9 rounded-[14px]",
  md: "h-12 w-12 rounded-[16px]",
  lg: "h-14 w-14 rounded-[18px]",
};

const ICON_SIZE_CLASS: Record<NonNullable<PaymentLogoProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function PaymentLogo({
  id,
  size = "md",
  muted = false,
  className = "",
}: PaymentLogoProps) {
  const logo = PAYMENT_LOGOS[id];
  const Icon = logo.Icon;

  const base = [
    "relative isolate flex shrink-0 items-center justify-center overflow-hidden border shadow-[0_12px_30px_rgba(0,0,0,0.22)]",
    SIZE_CLASS[size],
    logo.borderClass,
    muted ? "opacity-75 saturate-[0.78]" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[base, logo.bgClass].join(" ")} aria-label={`${logo.name} logo`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.22),transparent_34%)]" />
      <Icon className={["relative z-10 drop-shadow-sm", ICON_SIZE_CLASS[size], logo.iconClass].join(" ")} />
      <span className="sr-only">{logo.name}</span>
    </div>
  );
}
