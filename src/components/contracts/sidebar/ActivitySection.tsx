import { CheckCircle, Clock, FileText, MessageSquare, ShieldAlert, Sparkles, Wallet } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { WorkspaceModel, RoleTheme, ContractActivityEvent } from './types';
import { fmtDate, labelClass } from './SidebarSharedComponents';

export function ActivityTab({ events, model, contract }: { events: ContractActivityEvent[]; model: WorkspaceModel; contract: any; rt: RoleTheme }) {
    const { tx } = useTranslation();
    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="border-b border-zinc-805/50 pb-4">
                <p className={labelClass}>{tx('contract.tabs.activity')}</p>
                <h3 className="text-[16px] font-bold text-zinc-100 mt-0.5">{tx('wallet.transactionHistory')}</h3>
            </div>

            <div className="flex flex-col gap-0 relative ps-8">
                {/* Connecting Line */}
                <div className="absolute start-[11px] top-2 bottom-2 w-px bg-zinc-800" />

                {/* Milestone 1: Hired */}
                <EventRow 
                    icon={<Sparkles className="h-3 w-3" />}
                    title={tx('nav.contracts')}
                    date={contract.created_at}
                    description={`Contract created by ${contract.client?.full_name || tx('messages.userFallback')}`}
                    isLast={events.length === 0}
                />

                {events.map((event, idx) => (
                    <EventRow
                        key={idx}
                        icon={getEventIcon(event.type)}
                        title={formatEventType(event.type, tx)}
                        date={event.created_at}
                        description={event.description}
                        isLast={idx === events.length - 1}
                    />
                ))}

                {/* Milestone X: Current status indicator if active */}
                {model.st !== 'completed' && (
                    <div className="flex items-center gap-3 py-3 opacity-50">
                        <div className="absolute -start-7 w-5 h-5 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                            <Clock className="h-2.5 w-2.5 text-zinc-500" />
                        </div>
                        <span className="text-[12px] text-zinc-500 italic">{tx('messages.offline.statusWaiting')}</span>
                    </div>
                )}
            </div>
        </section>
    );
}

function EventRow({ icon, title, date, description, isLast }: { icon: React.ReactNode; title: string; date: string; description: string; isLast: boolean }) {
    return (
        <div className={`relative flex flex-col gap-1 ${isLast ? 'pb-2' : 'pb-8'}`}>
            <div className="absolute -start-8 top-0 w-6 h-6 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 z-10">
                {icon}
            </div>
            <div className="flex items-center justify-between gap-4">
                <h4 className="text-[13px] font-bold text-zinc-200">{title}</h4>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{fmtDate(date)}</span>
            </div>
            <p className="text-[12px] text-zinc-400 leading-relaxed">{description}</p>
        </div>
    );
}

function getEventIcon(type: string) {
    switch (type) {
        case 'delivery': return <FileText className="h-3 w-3 text-violet-400" />;
        case 'payment': return <Wallet className="h-3 w-3 text-emerald-400" />;
        case 'dispute': return <ShieldAlert className="h-3 w-3 text-rose-400" />;
        case 'message': return <MessageSquare className="h-3 w-3 text-sky-400" />;
        case 'milestone': return <CheckCircle className="h-3 w-3 text-emerald-400" />;
        default: return <Clock className="h-3 w-3 text-zinc-500" />;
    }
}

function formatEventType(type: string, tx: any) {
    switch (type) {
        case 'delivery': return tx('messages.system.deliveryTitle');
        case 'payment': return tx('wallet.status.contract');
        case 'dispute': return tx('messages.system.disputeTitle');
        case 'message': return tx('messages.userFallback');
        case 'milestone': return tx('contract.tabs.milestones');
        default: return tx('contract.title');
    }
}
