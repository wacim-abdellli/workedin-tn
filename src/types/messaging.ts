import type { Profile } from './profile';
import type { MessageAttachment } from './attachments';

export interface Message {
    id: string;
    contract_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachments?: MessageAttachment[];
    file_url?: string;
    is_read?: boolean;
    created_at: string;
    sender?: Profile;
    receiver?: Profile;
}
