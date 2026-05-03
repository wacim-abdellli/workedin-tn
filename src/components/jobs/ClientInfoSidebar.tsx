import { BadgeCheck, CheckCircle2, MapPin, Star } from "lucide-react";
import OptimizedImage from "@/components/common/OptimizedImage";
import { useTranslation } from "@/i18n";

interface ClientInfoSidebarProps {
  clientName?: string;
  location?: string;
  avatarUrl?: string | null;
  ratingText?: string;
  jobsPosted?: string;
  hireRate?: string;
  totalSpent?: string;
  avgHourlyPaid?: string;
  paymentVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  memberSince?: string;
  onViewProfile?: () => void;
  isOwnProfile?: boolean;
}

function getInitials(value: string): string {
  const parts = value.split(" ").map((c) => c.trim()).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "CL";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default function ClientInfoSidebar({
  clientName = "TechCorp Tunis",
  location = "Tunis",
  avatarUrl = null,
  ratingText = "4.8 of 5 reviews",
  jobsPosted = "15",
  hireRate = "75%",
  totalSpent = "15k+ TND",
  avgHourlyPaid = "45 TND/hr",
  paymentVerified = true,
  phoneVerified = false,
  emailVerified = false,
  memberSince = "Mar 2026",
  onViewProfile,
  isOwnProfile = false,
}: ClientInfoSidebarProps) {
  const { tx } = useTranslation();

  const statGrid = [
    { value: jobsPosted,    label: tx("jobDetail.postedJobs",     undefined, "Jobs Posted")    },
    { value: hireRate,      label: tx("jobDetail.hireRate",        undefined, "Hire Rate")      },
    { value: totalSpent,    label: tx("jobDetail.totalSpending",   undefined, "Total Spent")    },
    { value: avgHourlyPaid, label: tx("jobDetail.avgHourlyPaid",   undefined, "Avg Hourly Paid")},
  ];

  const verifications = [
    { id: 'payment', label: tx("jobDetail.paymentMethodVerified", undefined, "Payment method verified"), ok: paymentVerified, fixUrl: '/settings?tab=payment' },
    { id: 'phone', label: tx("jobDetail.phoneNumberVerified",   undefined, "Phone number verified"),  ok: phoneVerified, fixUrl: '/settings?tab=profile' },
    { id: 'email', label: tx("jobDetail.emailAddressVerified",  undefined, "Email address verified"),  ok: emailVerified, fixUrl: '/settings?tab=profile' },
  ];

  return (
    <aside className="rounded-2xl border border-white/5 bg-[var(--color-bg-elevated)] p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]/80">
          {tx("jobDetail.aboutClient", undefined, "About the Client")}
        </h3>
        {onViewProfile && (
          <button
            type="button"
            onClick={onViewProfile}
            className="text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            {tx("jobDetail.viewClientProfile", undefined, "View profile")}
          </button>
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <OptimizedImage
              src={avatarUrl}
              alt={clientName}
              className="w-11 h-11 rounded-full ring-2 ring-white/8"
              imgClassName="object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-[var(--color-text-primary)] ring-2 ring-white/5 bg-gradient-to-br from-amber-500 to-amber-700">
              {getInitials(clientName)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">{clientName}</p>
          <p className="text-xs text-[var(--color-text-primary)]/45 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {location}
          </p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
        <span className="text-xs text-[var(--color-text-primary)]/60">{ratingText}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
        {statGrid.map(({ value, label }) => (
          <div key={label} className="rounded-xl bg-[var(--color-bg-elevated)] border border-white/5 p-3">
            <p className="text-base font-black text-[var(--color-text-primary)] leading-none">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]/40 mt-1.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Verifications */}
      <div className="pt-4 border-t border-white/5 space-y-2.5">
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]/60 uppercase tracking-wider">
          {tx("jobDetail.clientVerifications", undefined, "Verifications")}
        </h4>
        {verifications.map(({ id, label, ok, fixUrl }) => {
          const content = (
            <div key={id} className={`flex items-center gap-2 text-xs ${(!ok && isOwnProfile) ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
              {ok
                ? <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                : <CheckCircle2 className={`w-4 h-4 shrink-0 ${isOwnProfile ? 'text-amber-400/80' : 'text-[var(--color-text-primary)]/20'}`} />}
              <span className={ok ? 'text-[var(--color-text-primary)]/70' : 'text-[var(--color-text-primary)]/30 line-through'}>
                {label}
              </span>
              {!ok && isOwnProfile && (
                <span className="text-[10px] text-amber-400 ml-auto whitespace-nowrap bg-amber-400/10 px-1.5 py-0.5 rounded">Fix now</span>
              )}
            </div>
          );

          if (!ok && isOwnProfile && fixUrl) {
            return (
              <a href={fixUrl} key={id} className="block no-underline">
                {content}
              </a>
            );
          }
          return content;
        })}
        <p className="text-[10px] text-[var(--color-text-primary)]/25 pt-1">
          {tx("jobDetail.memberSince", undefined, "Member since")} {memberSince}
        </p>
      </div>
    </aside>
  );
}


