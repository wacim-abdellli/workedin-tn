export type ContractRow = {
    id: string;
    proposal_id?: string | null;
    status: string | null;
    title: string | null;
    amount: number | null;
    total_amount: number | null;
    revision_requests_count: number | null;
    max_revision_rounds: number | null;
    funded_at: string | null;
    delivery_submitted_at: string | null;
    review_due_at: string | null;
    client_id: string | null;
    freelancer_id: string | null;
    job_id: string | null;
    escrow_pending_clearance_until?: string | null;
    escrow_hold_disputed?: boolean;
    payment_status?: string | null;
    delivery_note?: string | null;
    dhmad_escrow_id?: string | null;
    dhmad_payment_url?: string | null;
    milestones?: ContractMilestone[];
};

export type ContractMilestone = {
    id: string;
    contract_id: string;
    title?: string | null;
    status?: string | null;
    amount?: number | null;
    created_at?: string | null;
    [key: string]: unknown;
};

export type DeliveryAsset = {
    id: string;
    asset_kind: 'review_asset' | 'final_asset';
    access_state: 'preview_available' | 'locked' | 'released';
    name: string;
    storage_bucket?: string | null;
    storage_path: string;
    mime_type?: string | null;
    size_bytes?: number | null;
};

export type LatestDelivery = {
    id: string;
    submitted_at?: string | null;
    review_due_at?: string | null;
    locked_final_asset_count?: number | null;
    assets?: DeliveryAsset[];
    links?: DeliveryLink[];
};

export type DeliveryLink = {
    link_kind?: string;
    url?: string;
    name?: string;
    [key: string]: unknown;
};

export type SharedFile = {
    id: string;
    name: string;
    url: string;
    type?: string | null;
    size?: number | string | null;
    uploadedAt?: string | null;
    senderName?: string;
};
