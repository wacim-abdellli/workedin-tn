import { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, ExternalLink, Shield, Star } from 'lucide-react';

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
        <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center text-amber-400 text-2xl font-black shadow-lg shadow-amber-500/20">
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
        <div className={`flex flex-col h-full min-h-0 overflow-hidden bg-[var(--color-bg-base)] items-center justify-center px-8 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/6 blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-6">
                {/* Check badge + avatar */}
                <div className="relative">
                    {freelancerAvatar ? (
                        <img
                            src={freelancerAvatar}
                            alt={freelancerName}
                            className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 object-cover shadow-lg shadow-amber-500/20"
                        />
                    ) : (
                        <Initials name={freelancerName} />
                    )}
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 border-2 border-[var(--color-bg-base)] shadow-lg">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Main message */}
                <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest font-black text-amber-500">Contract Created</p>
                    <h2 className="text-2xl font-black text-white leading-snug">
                        You hired{' '}
                        <span className="text-amber-400">{freelancerName}</span>!
                    </h2>
                    {jobTitle && (
                        <p className="text-sm text-white/50 font-medium">
                            for &ldquo;<span className="text-white/70">{jobTitle}</span>&rdquo;
                        </p>
                    )}
                </div>

                {/* Trust card */}
                <div className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-xs font-bold text-amber-200">Secure your contract</p>
                    </div>
                    <p className="text-xs text-white/50 text-left leading-relaxed">
                        Fund{' '}
                        <span className="font-bold text-amber-300">{fmtAmount(amount)} TND</span>{' '}
                        into escrow from the workspace. Your money is protected until you approve the delivery.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                        {[
                            'Proposal submitted',
                            'Contract created',
                            'Fund escrow',
                            'Work begins',
                        ].map((step, i) => (
                            <div key={step} className="flex items-center gap-1 flex-1">
                                <div className={`flex-1 h-0.5 ${i < 2 ? 'bg-amber-500' : 'bg-white/10'}`} />
                                {i === 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-white/40 font-semibold uppercase tracking-wider">
                        <span className="text-amber-400">✓ Hired</span>
                        <span>Fund escrow →</span>
                    </div>
                </div>

                {/* What's next */}
                <div className="w-full rounded-xl border border-white/5 bg-white/2 p-3 text-left space-y-2">
                    <p className="text-[10px] uppercase tracking-wider font-black text-white/40">Next steps</p>
                    <div className="space-y-1.5">
                        {[
                            { icon: <MessageSquare className="w-3.5 h-3.5" />, text: 'Open the contract chat to align on details' },
                            { icon: <Shield className="w-3.5 h-3.5" />, text: `Fund ${fmtAmount(amount)} TND escrow from the workspace` },
                            { icon: <Star className="w-3.5 h-3.5" />, text: 'Review and approve delivery when ready' },
                        ].map(({ icon, text }) => (
                            <div key={text} className="flex items-start gap-2">
                                <span className="mt-0.5 text-amber-500/70 shrink-0">{icon}</span>
                                <p className="text-[12px] text-white/60">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA buttons */}
                <div className="flex w-full gap-2">
                    <button
                        type="button"
                        onClick={onGoToChat}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-95"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Open Chat
                    </button>
                    <button
                        type="button"
                        onClick={onGoToWorkspace}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Workspace
                    </button>
                </div>
            </div>
        </div>
    );
}
