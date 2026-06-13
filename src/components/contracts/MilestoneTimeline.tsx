import {
  useState,
  useEffect } from 'react';
import { 
    CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Lock,
  Timer,
  PackageCheck,
  AlertCircle
} from "lucide-react";
import { CountdownTimer } from '../ui';

type Milestone = {
    id: string;
    description: string;
    amount: number;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    due_date?: string;
    escrow_pending_clearance_until?: string;
    escrow_hold_disputed?: boolean;
};

type MilestoneTimelineProps = {
    milestones: Milestone[];
    userRole: 'client' | 'freelancer';
    onDeliver?: (milestoneId: string) => void;
    onAcceptMilestone?: (milestoneId: string) => Promise<void>;
    onHoldMilestoneClearance?: (milestoneId: string) => void;
    isActionLoading?: boolean;
};

export default function MilestoneTimeline({
    milestones,
    userRole,
    onDeliver,
    onAcceptMilestone,
    onHoldMilestoneClearance,
    isActionLoading = false,
}: MilestoneTimelineProps) {
    const [activeMilestoneId, setActiveMilestoneId] = useState<string>('');

    // Default active milestone to the first one that is not approved/paid
    useEffect(() => {
        if (milestones && milestones.length > 0) {
            const firstPending = milestones.find(m => m.status !== 'approved');
            if (firstPending) {
                setActiveMilestoneId(firstPending.id);
            } else {
                setActiveMilestoneId(milestones[milestones.length - 1].id);
            }
        }
    }, [milestones]);

    if (!milestones || milestones.length === 0) return null;

    const activeMilestone = milestones.find(m => m.id === activeMilestoneId) || milestones[0];
    const completedCount = milestones.filter(m => m.status === 'approved').length;
    const progressPercent = Math.round((completedCount / milestones.length) * 100);

    const fmtAmount = (amount: number) => {
        return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(amount);
    };

    const fmtDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <section className="border border-zinc-800 bg-zinc-900/20 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
            {/* Header with overall progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Project Milestones</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        {completedCount} of {milestones.length} milestones approved ({progressPercent}%)
                    </p>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="flex items-center gap-3 w-full sm:max-w-[200px]">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80 border border-white/[0.03]">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-350">{progressPercent}%</span>
                </div>
            </div>

            {/* Horizontal Timeline Track */}
            <div className="relative flex items-center justify-between gap-4 py-8 overflow-x-auto min-h-[140px] scrollbar-thin select-none">
                {/* Horizontal connection line behind nodes */}
                <div className="absolute left-10 right-10 top-[60px] h-0.5 bg-zinc-800" />
                
                {/* Filled connection line up to active/completed milestone */}
                <div 
                    className="absolute left-10 top-[60px] h-0.5 bg-emerald-500/80 transition-all duration-500 hidden md:block"
                    style={{ 
                        width: `calc(${((completedCount) / Math.max(1, milestones.length - 1)) * 100}% - 40px)`,
                        maxWidth: 'calc(100% - 80px)' 
                    }}
                />

                {milestones.map((milestone, idx) => {
                    const isApproved = milestone.status === 'approved';
                    const isSubmitted = milestone.status === 'submitted';
                    const isRejected = milestone.status === 'rejected';
                    const isActive = milestone.id === activeMilestoneId;
                    
                    let statusColor = 'border-zinc-700 bg-[#0d0d11] text-zinc-500';
                    let glowClass = '';

                    if (isApproved) {
                        statusColor = 'bg-emerald-500 border-transparent text-white';
                    } else if (isSubmitted) {
                        statusColor = 'border-amber-500 bg-[#16130d] text-amber-500';
                        glowClass = 'shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse';
                    } else if (isRejected) {
                        statusColor = 'border-red-500 bg-[#1a0f0f] text-red-500';
                    } else if (isActive) {
                        statusColor = 'border-sky-500 bg-[#0d131a] text-sky-400';
                        glowClass = 'ring-2 ring-sky-500/20';
                    }

                    return (
                        <div 
                            key={milestone.id || idx}
                            onClick={() => setActiveMilestoneId(milestone.id)}
                            className="relative flex flex-col items-center cursor-pointer min-w-[100px] flex-1 z-10 group"
                        >
                            {/* Step circle node */}
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${statusColor} ${glowClass} group-hover:scale-110`}>
                                {isApproved ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : isSubmitted ? (
                                    <Timer className="h-5 w-5" />
                                ) : isRejected ? (
                                    <AlertTriangle className="h-5 w-5" />
                                ) : (
                                    <span className="font-mono text-xs font-bold">{idx + 1}</span>
                                )}
                            </div>

                            {/* Short label */}
                            <p className={`mt-3 text-[12px] font-semibold text-center truncate max-w-[120px] transition-colors ${
                                isActive ? 'text-sky-400 font-bold' : isApproved ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-400'
                            }`}>
                                {milestone.description}
                            </p>

                            {/* Amount */}
                            <p className="mt-1 text-[10px] font-mono text-zinc-500">
                                {fmtAmount(milestone.amount)}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Active Milestone Detail Panel Card */}
            {activeMilestone && (
                <div className="rounded-xl border border-zinc-800 bg-[#0b0b0d]/60 p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-250">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider select-none leading-none ${
                                activeMilestone.status === 'approved' 
                                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                                    : activeMilestone.status === 'submitted'
                                    ? 'border-amber-500/20 bg-amber-500/5 text-amber-300 animate-pulse'
                                    : activeMilestone.status === 'rejected'
                                    ? 'border-red-500/20 bg-red-500/5 text-red-400'
                                    : 'border-zinc-700 bg-zinc-850 text-zinc-400'
                            }`}>
                                {activeMilestone.status === 'approved' ? 'Paid & Approved' : activeMilestone.status.toUpperCase()}
                            </span>
                            <h4 className="text-[15px] font-bold text-zinc-100 mt-2">{activeMilestone.description}</h4>
                            
                            {activeMilestone.due_date && (
                                <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 select-none">
                                    <Clock className="h-3 w-3" /> Due by {fmtDate(activeMilestone.due_date)}
                                </p>
                            )}
                        </div>

                        {/* Amount Badge */}
                        <div className="text-right shrink-0 select-none">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Milestone Payout</p>
                            <p className="text-lg font-black text-sky-400 tracking-tight mt-0.5">{fmtAmount(activeMilestone.amount)}</p>
                        </div>
                    </div>

                    {/* Escrow/Dispute Hold Alert Panels */}
                    {activeMilestone.escrow_pending_clearance_until && 
                     new Date(activeMilestone.escrow_pending_clearance_until).getTime() > Date.now() && 
                     !activeMilestone.escrow_hold_disputed && (
                        <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.03] p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="flex items-start gap-2.5">
                                <Timer className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                                <div>
                                    <p className="text-xs font-bold text-zinc-200">🛡️ Escrow Payout Hold Active</p>
                                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                        Payout is locked in a 48-hour security clearance window. Remaining:{' '}
                                        <CountdownTimer targetDate={activeMilestone.escrow_pending_clearance_until} className="text-amber-400" />
                                    </p>
                                </div>
                            </div>
                            {userRole === 'client' && onHoldMilestoneClearance && (
                                <button
                                    type="button"
                                    onClick={() => onHoldMilestoneClearance(activeMilestone.id)}
                                    className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 text-[10px] font-bold active:scale-95 transition-all cursor-pointer border-none"
                                >
                                    Hold Payout
                                </button>
                            )}
                        </div>
                    )}

                    {activeMilestone.escrow_hold_disputed && (
                        <div className="rounded-lg border border-red-500/25 bg-red-500/[0.03] p-4">
                            <div className="flex items-start gap-2.5">
                                <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-red-400">⚠️ Payout Frozen</p>
                                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                        Client suspended payout clearance for this milestone. WorkedIn support team is investigating the deliverables.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Milestone Actions Buttons */}
                    <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-zinc-900">
                        {/* Freelancer Action: Submit delivery */}
                        {userRole === 'freelancer' && 
                         (activeMilestone.status === 'pending' || activeMilestone.status === 'rejected') && 
                         onDeliver && (
                            <button
                                type="button"
                                onClick={() => onDeliver(activeMilestone.id)}
                                className="rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-xs font-bold transition-all shadow active:scale-95 border-none cursor-pointer flex items-center gap-1.5"
                            >
                                <ArrowRight className="h-4 w-4" />
                                Submit Milestone Delivery
                            </button>
                        )}

                        {/* Client Action: Approve & Release */}
                        {userRole === 'client' && 
                         activeMilestone.status === 'submitted' && 
                         onAcceptMilestone && (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onAcceptMilestone(activeMilestone.id)}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all shadow active:scale-95 border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isActionLoading ? (
                                    <Timer className="h-4 w-4 animate-spin" />
                                ) : (
                                    <PackageCheck className="h-4 w-4" />
                                )}
                                Approve & Release Payment
                            </button>
                        )}

                        {/* Lock / Protected signal */}
                        {activeMilestone.status === 'pending' && userRole === 'client' && (
                            <p className="text-[11px] text-zinc-500 flex items-center gap-1 leading-none select-none">
                                <Lock className="h-3 w-3 text-zinc-650" /> Funds protected in Dhmad escrow
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
