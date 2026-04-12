import { BadgeCheck, CheckCircle2, MapPin, Star } from "lucide-react";

import OptimizedImage from "@/components/common/OptimizedImage";

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
}

function getInitials(value: string): string {
  const parts = value
    .split(" ")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "CL";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
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
}: ClientInfoSidebarProps) {
  return (
    <aside className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col">
      <h3 className="text-base font-bold text-white mb-6">About the Client</h3>

      <div className="flex items-center gap-4 mb-4">
        {avatarUrl ? (
          <OptimizedImage
            src={avatarUrl}
            alt={clientName}
            className="w-12 h-12 rounded-full"
            imgClassName="object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center text-gray-400 text-sm font-semibold">
            {getInitials(clientName)}
          </div>
        )}

        <div>
          <p className="font-semibold text-white">{clientName}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Star className="text-orange-500 fill-orange-500 w-4 h-4" />
        <span className="text-sm text-gray-300">{ratingText}</span>
      </div>

      <div className="border-t border-[#262626] pt-6">
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <span className="text-white font-bold text-lg">{jobsPosted}</span>
            <span className="text-xs text-gray-500 block">Jobs Posted</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">{hireRate}</span>
            <span className="text-xs text-gray-500 block">Hire Rate</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">{totalSpent}</span>
            <span className="text-xs text-gray-500 block">Total Spent</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">{avgHourlyPaid}</span>
            <span className="text-xs text-gray-500 block">Avg Hourly Paid</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#262626] mt-6 pt-6">
        <h4 className="text-sm font-semibold text-white mb-4">Client Verifications</h4>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-gray-300">
            <BadgeCheck className={`w-4 h-4 ${paymentVerified ? "text-green-500" : "text-gray-500"}`} />
            <span>Payment method verified</span>
          </div>

          <div className="flex items-center gap-2.5 text-gray-300">
            <CheckCircle2 className={`w-4 h-4 ${phoneVerified ? "text-green-500" : "text-gray-500"}`} />
            <span>Phone number verified</span>
          </div>

          <div className="flex items-center gap-2.5 text-gray-300">
            <CheckCircle2 className={`w-4 h-4 ${emailVerified ? "text-green-500" : "text-gray-500"}`} />
            <span>Email address verified</span>
          </div>
        </div>

        <span className="text-xs text-gray-500 mt-6 block">Member since {memberSince}</span>
      </div>
    </aside>
  );
}
