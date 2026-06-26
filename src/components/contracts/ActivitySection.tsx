import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { Clock } from 'lucide-react';
import { fmtTime, labelClass, type RoleTheme } from './contractUtils';
import { CompactEmpty, PartyAvatar } from './sidebarPrimitives';
import type { ContractActivityEvent, ContractSidebarData, WorkspaceModel } from './types';

export function ActivityTab({ events, model, contract, rt }: { events: ContractActivityEvent[]; model: WorkspaceModel; contract: ContractSidebarData; rt: RoleTheme }) {
    const { tx } = useTranslation();
    const fallbackEvents = useMemo<ContractActivityEvent[]>(() => {
        const items: ContractActivityEvent[] = [];
        if (contract.deliverySubmittedAt) items.push({ id: 'delivery-date', text: tx('pages.messages.contractDetails.eventWorkDelivered'), timestamp: contract.deliverySubmittedAt, actorRole: 'freelancer', kind: 'delivery' });
        if (model.st === 'completed') items.push({ id: 'completed-state', text: tx('pages.messages.contractDetails.eventWorkAccepted'), timestamp: contract.reviewDueAt || contract.deliverySubmittedAt, actorRole: 'system', kind: 'payment', system: true });
        if (model.showReviewConfirmation) items.push({ id: 'review-state', text: tx('pages.messages.contractDetails.reviewStarsPlaceholder'), timestamp: null, actorRole: 'client', kind: 'review' });
        return items;
    }, [contract.deliverySubmittedAt, contract.reviewDueAt, model.showReviewConfirmation, model.st, tx]);
    const list = events.length > 0 ? events : fallbackEvents;

    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-4">
            <div className="border-b border-zinc-850/50 pb-3">
                <p className={labelClass}>{tx('pages.messages.contractDetails.activityLog')}</p>
                <h3 className="text-[15px] font-bold text-white mt-0.5">{tx('pages.messages.contractDetails.contractEventHistory')}</h3>
            </div>
            {list.length > 0 ? (
                <div className="relative flex flex-col gap-6 pl-8 mt-2">
                    <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-zinc-800" />
                    {list.map(event => (
                        <ActivityRow key={event.id} event={event} rt={rt} />
                    ))}
                </div>
            ) : (
                <CompactEmpty icon={<Clock className="h-3.5 w-3.5" />} title={tx('pages.messages.contractDetails.noActivityYet')} text={tx('pages.messages.contractDetails.noActivityYetDesc')} />
            )}
        </section>
    );
}

function ActivityRow({ event, rt: _rt }: { event: ContractActivityEvent; rt: RoleTheme }) {
    const { tx } = useTranslation();
    const isSystem = event.system || event.actorRole === 'system' || event.kind === 'payment' || event.kind === 'system';

    const dotColor = isSystem
        ? 'border-zinc-700 bg-zinc-800'
        : event.actorRole === 'client'
        ? 'border-emerald-600 bg-emerald-600/10'
        : 'border-emerald-600 bg-emerald-600/10';

    return (
        <div className="relative flex flex-col gap-1">
            <div className={`absolute -start-[30px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${dotColor} bg-[#0d0d11]`} />

            {isSystem ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pl-2">
                    <p className="text-[12px] font-medium text-zinc-400 leading-relaxed">{event.text}</p>
                    {event.timestamp && (
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                            {fmtTime(event.timestamp)}
                        </span>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-1 pl-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyAvatar party={{ full_name: event.actorName || undefined, avatar_url: event.actorAvatarUrl }} size="sm" />
                          <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-zinc-100 truncate">
                                  {event.actorName || (event.actorRole === 'client' ? tx('pages.messages.contractDetails.clientFallback') : tx('pages.messages.contractDetails.freelancerFallback'))}
                              </p>
                          </div>
                        </div>
                        {event.timestamp && (
                            <span className="text-[10px] text-zinc-500 font-mono shrink-0 pt-0.5">
                                {fmtTime(event.timestamp)}
                            </span>
                        )}
                    </div>
                    <div className="text-[12px] text-zinc-300 leading-normal pl-8 mt-0.5">
                        {event.text}
                    </div>
                </div>
            )}
        </div>
    );
}
