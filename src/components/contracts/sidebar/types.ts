export interface ContractMilestone {
    id?: string | null;
    title?: string | null;
    description?: string | null;
    amount?: number | null;
    status?: string | null;
    due_date?: string | null;
    escrow_pending_clearance_until?: string | null;
    escrow_hold_disputed?: boolean | null;
}

export interface ContractSharedFile {
    id: string;
    name: string;
    url: string;
    type?: string | null;
    size?: number | string | null;
    uploadedAt?: string | null;
    senderName?: string;
    storageBucket?: string | null;
    storagePath?: string | null;
}

export interface ContractDeliveryAsset {
    id: string;
    name: string;
    storagePath: string;
    storageBucket?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    assetKind: 'review_asset' | 'final_asset';
    accessState: 'preview_available' | 'locked' | 'released';
}

export interface DeliveryLink {
    id: string;
    link_kind: 'review_link' | 'final_link';
    url: string;
    label: string;
    category: 'github' | 'figma' | 'drive' | 'loom' | 'vercel' | 'other';
    credentials?: string;
    created_at: string;
}

export interface ContractSidebarData {
    amount: number | null;
    revisionRequestsCount?: number | null;
    maxRevisionRounds?: number | null;
    fundedAt?: string | null;
    escrowFunded?: boolean;
    deliverySubmittedAt?: string | null;
    reviewDueAt?: string | null;
    reviewFiles?: ContractDeliveryAsset[];
    finalFiles?: ContractDeliveryAsset[];
    deliveryLinks?: DeliveryLink[];
    lockedFinalFilesCount?: number;
    job?: { title?: string | null; deadline?: string | null };
    lastRevisionNote?: string | null;
    milestones?: ContractMilestone[];
    sharedFiles?: ContractSharedFile[];
    freelancer?: { full_name?: string; avatar_url?: string | null };
    client?: { full_name?: string; avatar_url?: string | null };
    escrowPendingClearanceUntil?: string | null;
    paymentStatus?: string | null;
    escrowHoldDisputed?: boolean | null;
}

export interface ContractActivityEvent {
    id: string;
    text: string;
    timestamp?: string | null;
    actorName?: string | null;
    actorRole?: 'client' | 'freelancer' | 'system' | null;
    actorAvatarUrl?: string | null;
    kind?: 'message' | 'delivery' | 'payment' | 'review' | 'revision' | 'dispute' | 'system';
    system?: boolean;
}

export type FileFilter = 'all' | 'delivery' | 'shared';

export interface WorkspaceModel {
    st: string;
    status: { label: string; tone: string; accent: string; icon: any };
    isEscrowFunded: boolean;
    reviewFiles: ContractDeliveryAsset[];
    finalFiles: ContractDeliveryAsset[];
    reviewLinks: DeliveryLink[];
    finalLinks: DeliveryLink[];
    sharedFiles: ContractSharedFile[];
    showFreelancerDeliver: boolean;
    milestones: ContractMilestone[];
    completedMilestones: number;
    showReviewConfirmation: boolean;
    totalAmount: number;
    otherParty?: { full_name?: string; avatar_url?: string | null } | null;
    showLeaveReview: boolean;
    showClientReview: boolean;
    revUsed: number;
    revMax: number;
    revLeft: number;
    canDispute: boolean;
    nextMove: { icon: any; title: string; body: string; primaryLabel: string | null; accentColor: string; iconColor: string };
    fundedAt: string | null;
    deliverySubmittedAt: string | null;
    reviewDueAt: string | null;
    lastRevisionNote: string | null;
    amount: number | null;
}

export interface RoleTheme {
    bg: string;
    accent: string;
    text: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    accentFill: string;
    roleLabel: string;
    roleBadge: string;
    headerStripe: string;
    primaryBtn: string;
    focusRingColor: string;
    tabAccent: string;
    tabActiveBg: string;
}
