import type { ReactNode } from 'react';
import { useTranslation } from '@/i18n';
import { Shield, ArrowLeft, MessageSquare } from 'lucide-react';
import { fmtDate, fmtAmount } from './contractUtils';
import { PartyAvatar } from './sidebarPrimitives';

interface ContractSidebarHeaderProps {
  contract: { job?: { title?: string; deadline?: string }; amount?: number | null };
  otherParty: { full_name?: string } | null;
  userRole: 'client' | 'freelancer';
  isEscrowFunded: boolean;
  status: { label: string; tone: string; icon: ReactNode };
  onGoBack?: () => void;
  onGoToMessages?: () => void;
  onOpenWorkspace?: () => void;
  isSidebar?: boolean;
}

export default function ContractSidebarHeader({
  contract,
  otherParty,
  userRole,
  isEscrowFunded,
  status,
  onGoBack,
  onGoToMessages,
  onOpenWorkspace,
  isSidebar = false,
}: ContractSidebarHeaderProps) {
  const { tx } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-white/[0.06] bg-[#070709]/95 backdrop-blur-md">
      <div className={`flex flex-col gap-3 py-3 ${isSidebar ? 'px-4' : 'px-6'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <PartyAvatar party={otherParty} size="md" />
            <div className="flex min-w-0 flex-col">
              <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-zinc-100">
                {contract.job?.title || tx('pages.messages.contractDetails.untitledContract')}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="font-semibold uppercase tracking-wider text-zinc-400">
                  {userRole === 'client' ? tx('auth.accountPanel.freelancerLabel') : tx('auth.accountPanel.clientLabel')}
                </span>
                <span>•</span>
                <span className="truncate">{otherParty?.full_name || tx('pages.messages.contractDetails.counterparty')}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end pl-2">
            <span className="text-[15px] font-semibold leading-tight text-zinc-100">
              {fmtAmount(contract.amount)}
            </span>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 leading-none">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>{isEscrowFunded ? tx('pages.messages.contractDetails.inEscrow') : tx('pages.messages.contractDetails.pendingEscrow')}</span>
            </div>
          </div>
        </div>

        <div className="mt-0.5 flex items-center justify-between border-t border-white/[0.04] pt-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase leading-none ${status.tone}`}>
              {status.icon}{status.label}
            </span>
            {contract.job?.deadline && (
              <span className="text-[11px] text-zinc-500">
                {tx('pages.messages.contractDetails.due')} {fmtDate(contract.job.deadline)}
              </span>
            )}
          </div>

          {(onGoBack || onGoToMessages || onOpenWorkspace) && (
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenWorkspace && (
                <button
                  type="button"
                  onClick={onOpenWorkspace}
                  aria-label={tx('pages.messages.contractDetails.openContractPage')}
                  className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold border border-zinc-700 bg-zinc-900/30 text-zinc-350 transition-all hover:bg-zinc-800 hover:text-white cursor-pointer"
                >
                  {tx('pages.messages.contractDetails.workspaceLink')}
                </button>
              )}
              {onGoBack && (
                <button type="button" onClick={onGoBack} className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/30 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-750">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              )}
              {onGoToMessages && (
                <button type="button" onClick={onGoToMessages} className="flex h-7 items-center gap-1.5 rounded-full px-3 bg-zinc-900/30 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-750">
                  <MessageSquare className="h-3 w-3" />
                  {tx('pages.messages.contractDetails.goToMessages')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
