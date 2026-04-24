import type { Message } from '@/services/messages';

export function isProtectedContractEvidenceMessage(message: Pick<Message, 'contract_id' | 'content'> | null | undefined) {
    if (!message?.contract_id) return false;

    const content = String(message.content || '');
    return content.startsWith('[[delivery]]')
        || content.startsWith('[[revision_requested]]')
        || content.startsWith('[[contract_completed]]')
        || content.startsWith('[[dispute_opened]]');
}
