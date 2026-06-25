import type { ContractStatus } from '@/types';

export interface ContractData {
    id: string;
    job_id: string;
    freelancer_id: string;
    client_id: string;
    status: ContractStatus;
    payment_status: 'pending' | 'paid' | 'released' | 'in_escrow';
    started_at: string;
    completed_at?: string;
    delivery_note?: string;
    dispute_reason?: string;
    revision_requests_count?: number;
    max_revision_rounds?: number;
    dhmad_escrow_id?: string;
    escrow_pending_clearance_until?: string | null;
    escrow_hold_disputed?: boolean;
    milestones?: ContractMilestone[];
}

export interface ContractMilestone {
    id: string;
    status?: string;
    dhmad_escrow_id?: string;
    escrow_hold_disputed?: boolean;
    [key: string]: unknown;
}

export interface UseContractStateOptions {
    contractId: string;
    userId: string;
    userRole: 'client' | 'freelancer';
    queryClient?: import('@tanstack/react-query').QueryClient;
    contract?: ContractData | null;
    setContract?: React.Dispatch<React.SetStateAction<ContractData | null>> | ((contract: ContractData | null) => void);
}

export interface UseContractStateReturn {
    contract: ContractData | null;
    isLoading: boolean;
    error: Error | null;
    deliverWork: (
        note: string,
        reviewAssets?: Array<Record<string, string>>,
        finalAssets?: Array<Record<string, string>>,
        links?: Array<Record<string, unknown>>
    ) => Promise<void>;
    acceptWork: () => Promise<void>;
    requestChanges: (feedback: string) => Promise<void>;
    openDispute: (reason: string) => Promise<void>;
    holdClearancePayment: (reason: string) => Promise<void>;
    deliverMilestoneWork: (
        milestoneId: string,
        note: string,
        reviewAssets?: Array<Record<string, string>>,
        finalAssets?: Array<Record<string, string>>,
        links?: Array<Record<string, unknown>>
    ) => Promise<void>;
    acceptMilestoneWork: (milestoneId: string) => Promise<void>;
    holdMilestoneClearance: (milestoneId: string, reason: string) => Promise<void>;
    canDeliver: boolean;
    canAccept: boolean;
    canDispute: boolean;
    canCancel: boolean;
    isDelivering: boolean;
    isAccepting: boolean;
    isDisputing: boolean;
    isCancelling: boolean;
    cancelContract: (reason: string) => Promise<void>;
    refresh: () => Promise<void>;
}
