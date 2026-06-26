import { useTranslation } from '@/i18n';
import { ShieldAlert, Timer } from 'lucide-react';
import { CountdownTimer } from '../ui';

interface ContractClearanceBannerProps {
  isActive: boolean;
  isDisputed: boolean;
  escrowPendingClearanceUntil?: string | null;
  userRole: 'client' | 'freelancer';
  onHoldClearance?: () => void;
}

export default function ContractClearanceBanner({
  isActive,
  isDisputed,
  escrowPendingClearanceUntil,
  userRole,
  onHoldClearance,
}: ContractClearanceBannerProps) {
  const { tx } = useTranslation();

  return (
    <>
      {isActive && (
        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/[0.03] p-5 shadow-[0_0_20px_rgba(245,158,11,0.05)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Timer className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-zinc-100">{tx('pages.messages.contractDetails.safetyHoldTitle')}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed animate-in fade-in duration-300">
                  {tx('pages.messages.contractDetails.safetyHoldBody')}{' '}
                  {escrowPendingClearanceUntil && (
                    <CountdownTimer targetDate={escrowPendingClearanceUntil} className="text-amber-400 font-bold" />
                  )}
                </p>
              </div>
            </div>
            {userRole === 'client' && onHoldClearance && (
              <button
                type="button"
                onClick={onHoldClearance}
                className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 px-4 py-2 text-[11px] font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {tx('pages.messages.contractDetails.holdPaymentReport')}
              </button>
            )}
          </div>
        </div>
      )}

      {isDisputed && (
        <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/[0.03] p-5 shadow-[0_0_20px_rgba(239,68,68,0.05)] backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-zinc-100">{tx('pages.messages.contractDetails.clearanceSuspendedTitle')}</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {tx('pages.messages.contractDetails.clearanceSuspendedBody')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
