import { PackageCheck, AlertCircle, X } from 'lucide-react';
import FundEscrow from '@/components/payments/FundEscrow';
import { RequestChangesModal, OpenDisputeModal, CancelContractModal } from '@/components/contracts/ContractModals';
import type { ContractRow } from './types';

type SharedAttachment = {
    url?: string;
    name?: string;
    type?: string;
    size?: number | string;
    [key: string]: unknown;
};

type WorkspaceModalsProps = {
    // Fund Escrow
    fundEscrowOpen: boolean;
    setFundEscrowOpen: React.Dispatch<React.SetStateAction<boolean>>;
    contract: ContractRow;
    loadWorkspace: () => Promise<void>;

    // Request Changes
    changesOpen: boolean;
    setChangesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleSubmitChanges: (note: string) => Promise<void>;

    // Dispute
    disputeOpen: boolean;
    setDisputeOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleSubmitDispute: (reason: string) => Promise<void>;

    // Cancel
    cancelOpen: boolean;
    setCancelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleSubmitCancel: (reason: string) => Promise<void>;

    // Confirm Release
    confirmReleaseOpen: boolean;
    setConfirmReleaseOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleConfirmRelease: () => Promise<void>;
    isAccepting: boolean;

    // Hold Clearance
    holdClearanceOpen: boolean;
    setHoldClearanceOpen: React.Dispatch<React.SetStateAction<boolean>>;
    holdClearanceReason: string;
    setHoldClearanceReason: React.Dispatch<React.SetStateAction<string>>;
    isHoldingClearance: boolean;
    handleSubmitHoldClearance: (reason: string) => Promise<void>;
};

export function WorkspaceModals({
    fundEscrowOpen, setFundEscrowOpen, contract, loadWorkspace,
    changesOpen, setChangesOpen, handleSubmitChanges,
    disputeOpen, setDisputeOpen, handleSubmitDispute,
    cancelOpen, setCancelOpen, handleSubmitCancel,
    confirmReleaseOpen, setConfirmReleaseOpen, handleConfirmRelease, isAccepting,
    holdClearanceOpen, setHoldClearanceOpen, holdClearanceReason, setHoldClearanceReason,
    isHoldingClearance, handleSubmitHoldClearance,
}: WorkspaceModalsProps) {
    return (
        <>
            {/* Fund Escrow Modal */}
            {fundEscrowOpen && contract ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fund escrow" onClick={() => setFundEscrowOpen(false)}>
                    <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Fund escrow</p>
                            <button type="button" onClick={() => setFundEscrowOpen(false)}
                                className="rounded-[8px] border border-white/[0.07] bg-[#161719] p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <FundEscrow
                            contract={{
                                id: contract.id,
                                client_id: contract.client_id ?? '',
                                freelancer_id: contract.freelancer_id ?? '',
                                budget: contract.amount ?? 0,
                                funded_at: contract.funded_at,
                            }}
                            onSuccess={() => { setFundEscrowOpen(false); void loadWorkspace(); }}
                            onError={() => setFundEscrowOpen(false)}
                        />
                    </div>
                </div>
            ) : null}

            {/* Request Changes Modal */}
            <RequestChangesModal
                isOpen={changesOpen}
                onClose={() => setChangesOpen(false)}
                onSubmit={handleSubmitChanges}
            />

            {/* Open Dispute Modal */}
            <OpenDisputeModal
                isOpen={disputeOpen}
                onClose={() => setDisputeOpen(false)}
                onSubmit={handleSubmitDispute}
            />

            {/* Cancel Contract Modal */}
            <CancelContractModal
                isOpen={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onSubmit={handleSubmitCancel}
                escrowFunded={Boolean(contract?.funded_at)}
            />

            {/* Confirm Release Payment Modal */}
            {confirmReleaseOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-release-title" onClick={() => setConfirmReleaseOpen(false)}>
                    <div className="w-full max-w-md rounded-[14px] border border-zinc-800 bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                                <PackageCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Release payment</p>
                                <h2 id="modal-release-title" className="text-[16px] font-semibold text-[var(--color-text-primary)]">Approve & release funds?</h2>
                            </div>
                        </div>
                        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                            <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                                This will release the escrowed funds to the freelancer and mark the contract as completed. <strong className="text-[var(--color-text-primary)]">This action cannot be undone.</strong>
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setConfirmReleaseOpen(false)} disabled={isAccepting}
                                className="rounded-full border border-zinc-700 bg-transparent px-4 py-2 text-[14px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleConfirmRelease()} disabled={isAccepting}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-[14px] font-semibold text-white transition-colors disabled:opacity-50">
                                {isAccepting ? 'Releasing…' : 'Approve & release'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Hold Clearance Payment Modal */}
            {holdClearanceOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-hold-title" onClick={() => setHoldClearanceOpen(false)}>
                    <div className="w-full max-w-md rounded-[14px] border border-zinc-800 bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Hold escrow clearance</p>
                                <h2 id="modal-hold-title" className="text-[16px] font-semibold text-[var(--color-text-primary)]">Suspend payment release?</h2>
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] mb-3">
                                Suspending payment clearance will stop the automatic 48-hour release timer and open a dispute review. Please explain what issues you found in the deliverables (e.g. broken repositories, incorrect credentials, missing source files).
                            </p>
                            <textarea
                                value={holdClearanceReason}
                                onChange={(e) => setHoldClearanceReason(e.target.value)}
                                placeholder="Describe the issues in detail..."
                                rows={4}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[13px] text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setHoldClearanceOpen(false)} disabled={isHoldingClearance}
                                className="rounded-full border border-zinc-700 bg-transparent px-4 py-2 text-[14px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleSubmitHoldClearance(holdClearanceReason)} disabled={isHoldingClearance || !holdClearanceReason.trim()}
                                className="inline-flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-[14px] font-semibold text-white transition-colors disabled:opacity-50">
                                {isHoldingClearance ? 'Holding…' : 'Suspend & report issue'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
