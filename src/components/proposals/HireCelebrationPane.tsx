import { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, ExternalLink, Shield } from 'lucide-react';

interface HireCelebrationPaneProps {
    freelancerName: string;
    freelancerAvatar: string | null;
    jobTitle: string | null;
    amount: number;
    contractId: string;
    freelancerId: string;
    onGoToChat: () => void;
    onGoToWorkspace: () => void;
}

const fmtAmount = (n: number) =>
    new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 2 }).format(n);

function Initials({ name }: { name: string }) {
    const init = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="w-16 h-16 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center text-amber-400 text-xl font-black shadow-md shadow-amber-500/5">
            {init}
        </div>
    );
}

export function HireCelebrationPane({
    freelancerName,
    freelancerAvatar,
    jobTitle,
    amount,
    onGoToChat,
    onGoToWorkspace,
}: HireCelebrationPaneProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`flex flex-col h-full min-h-0 bg-[var(--color-bg-base)] items-center justify-center px-8 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/5 blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-5">
                {/* Check badge + avatar */}
                <div className="relative">
                    {freelancerAvatar ? (
                        <img
                            src={freelancerAvatar}
                            alt={freelancerName}
                            className="w-16 h-16 rounded-2xl border border-amber-500/30 object-cover shadow-md shadow-amber-500/5"
                        />
                    ) : (
                        <Initials name={freelancerName} />
                    )}
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border border-[var(--color-bg-base)] shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>

                {/* Main message */}
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider font-black text-amber-500">Contract Created</p>
                    <h2 className="text-xl font-black text-white leading-snug">
                        You hired <span className="text-amber-400">{freelancerName}</span>!
                    </h2>
                    {jobTitle && (
                        <p className="text-xs text-white/50 font-medium">
                            for &ldquo;<span className="text-white/70">{jobTitle}</span>&rdquo;
                        </p>
                    )}
                </div>

                {/* Escrow Progress Box */}
                <div className="w-full rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.02] p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white/80">Escrow Balance</span>
                        </div>
                        <span className="text-xs font-black text-emerald-400">{fmtAmount(amount)} TND</span>
                    </div>
                    
                    <div className="relative pt-0.5">
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-1/3" />
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-white/40 mt-2">
                            <span className="text-emerald-400">1. Hired</span>
                            <span>2. Fund Escrow</span>
                            <span>3. Start Work</span>
                        </div>
                    </div>
                </div>

                {/* Stepper Guide */}
                <div className="w-full space-y-3 text-left pl-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Next Steps</p>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0 mt-0.5">1</div>
                            <p className="text-xs text-white/60 leading-relaxed">Open the chat to coordinate task specs and confirm the project schedule.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40 shrink-0 mt-0.5">2</div>
                            <p className="text-xs text-white/50 leading-relaxed">Fund the escrow deposit inside your workspace to secure payments and initiate work.</p>
                        </div>
                    </div>
                </div>

                {/* CTA buttons */}
                <div className="flex w-full gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onGoToChat}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-black shadow-md transition-all duration-200 hover:bg-amber-400 active:scale-95"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Open Chat
                    </button>
                    <button
                        type="button"
                        onClick={onGoToWorkspace}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/70 transition-all duration-200 hover:bg-white/5 hover:text-white active:scale-95"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Workspace
                    </button>
                </div>
            </div>
        </div>
    );
}
