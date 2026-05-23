import { useState } from 'react';
import { Shield, Wallet, Lock, ArrowRight, Clock, X } from 'lucide-react';

interface EscrowFundingBannerProps {
    amount: number;
    freelancerName: string;
    walletBalance: number | null;
    userRole: 'client' | 'freelancer';
    isLoading?: boolean;
    onFund: () => void;
}

const fmtAmount = (n: number) =>
    new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 2 }).format(n);

export function EscrowFundingBanner({
    amount,
    freelancerName,
    walletBalance,
    userRole,
    isLoading = false,
    onFund,
}: EscrowFundingBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    const canPayFromWallet = walletBalance !== null && walletBalance >= amount;

    if (userRole === 'freelancer') {
        return (
            <div className="mx-4 md:mx-6 mt-3 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-[12px] text-amber-200/80 flex-1">
                    Waiting for the client to secure the escrow before work begins.
                    You'll be notified once funds are confirmed.
                </p>
            </div>
        );
    }

    // Client view — the main CTA
    return (
        <div className="mx-4 md:mx-6 mt-3 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-lg">
            {/* Decorative glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                {/* Icon + text */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
                        <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white mb-0.5">
                            Secure your contract
                        </p>
                        <p className="text-[12px] text-white/60 leading-relaxed">
                            Fund{' '}
                            <span className="font-semibold text-amber-300">{fmtAmount(amount)} TND</span>
                            {' '}into escrow to start working with{' '}
                            <span className="text-white/80">{freelancerName}</span>.
                            Funds are held safely until you approve delivery.
                        </p>
                        {walletBalance !== null && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <Wallet className="w-3 h-3 text-white/40" />
                                <span className="text-[11px] text-white/40">
                                    Wallet balance:{' '}
                                    <span className={canPayFromWallet ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                                        {fmtAmount(walletBalance)} TND
                                    </span>
                                    {!canPayFromWallet && (
                                        <span className="ml-1 text-white/30">· Top up needed</span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onFund}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-md transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-60"
                    >
                        {isLoading ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <Lock className="w-4 h-4" />
                        )}
                        Fund {fmtAmount(amount)} TND
                        {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="rounded-lg p-2 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
