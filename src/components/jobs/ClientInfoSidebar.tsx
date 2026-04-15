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
}: ClientInfoSidebarProps) {
  const { tx } = useTranslation();

  const statGrid = [
    { value: jobsPosted,    label: tx("jobDetail.postedJobs",     undefined, "Jobs Posted")    },
    { value: hireRate,      label: tx("jobDetail.hireRate",        undefined, "Hire Rate")      },
    { value: totalSpent,    label: tx("jobDetail.totalSpending",   undefined, "Total Spent")    },
    { value: avgHourlyPaid, label: tx("jobDetail.avgHourlyPaid",   undefined, "Avg Hourly Paid")},
  ];

  const verifications = [
    { label: tx("jobDetail.paymentMethodVerified", undefined, "Payment method verified"), ok: paymentVerified },
    { label: tx("jobDetail.phoneNumberVerified",   undefined, "Phone number verified"),  ok: phoneVerified   },
    { label: tx("jobDetail.emailAddressVerified",  undefined, "Email address verified"),  ok: emailVerified   },
  ];

  return (
    <aside
      className="rounded-2xl border border-white/8 p-5 flex flex-col gap-5"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white/80">
          {tx("jobDetail.aboutClient", undefined, "About the Client")}
        </h3>
        {onViewProfile && (
          <button
            type="button"
            onClick={onViewProfile}
            className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 transition-colors whitespace-nowrap"
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
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/8"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            >
              {getInitials(clientName)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{clientName}</p>
          <p className="text-xs text-white/45 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {location}
          </p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
        <span className="text-xs text-white/60">{ratingText}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/8">
        {statGrid.map(({ value, label }) => (
          <div key={label} className="rounded-xl bg-black/20 border border-white/6 p-3">
            <p className="text-base font-black text-white leading-none">{value}</p>
            <p className="text-[10px] text-white/40 mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Verifications */}
      <div className="pt-4 border-t border-white/8 space-y-2.5">
        <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">
          {tx("jobDetail.clientVerifications", undefined, "Verifications")}
        </h4>
        {verifications.map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            {ok
              ? <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 text-white/20 shrink-0" />}
            <span className={ok ? 'text-white/70' : 'text-white/30 line-through'}>{label}</span>
          </div>
        ))}
        <p className="text-[10px] text-white/25 pt-1">
          {tx("jobDetail.memberSince", undefined, "Member since")} {memberSince}
        </p>
      </div>
    </aside>
  );
}
