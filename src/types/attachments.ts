export interface Attachment {
    id?: string;
    url: string;
    name: string;
    type: string;
    size: number | string;
    uploaded_at?: string;
    uploaded_by?: string;
}

export interface MessageAttachment extends Attachment {
    message_id?: string;
}

export interface ProposalAttachment extends Attachment {
    proposal_id?: string;
}
