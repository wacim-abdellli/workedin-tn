export function buildMessageAttachmentPath(conversationId: string, fileName: string) {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueToken = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    return `${conversationId}/${uniqueToken}-${safeFileName}`;
}

export async function getFileBytes(file: File): Promise<Uint8Array> {
    if (typeof file.arrayBuffer === 'function') {
        return new Uint8Array(await file.arrayBuffer());
    }

    const fallbackBuffer = await new Response(file).arrayBuffer();
    return new Uint8Array(fallbackBuffer);
}

export function getConversationCacheKey(
    user1: string,
    user2: string,
    contractId?: string | null,
    scope?: string | null
) {
    return [user1, user2].sort().join(':') + `:${contractId ?? 'none'}:${scope ?? 'auto'}`;
}

export function extractConversationIdFromRpcPayload(payload: unknown): string | null {
    if (typeof payload === 'string' && payload.trim().length > 0) {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const candidate = payload as { id?: unknown; conversation_id?: unknown };
        if (typeof candidate.id === 'string' && candidate.id.trim().length > 0) {
            return candidate.id;
        }
        if (typeof candidate.conversation_id === 'string' && candidate.conversation_id.trim().length > 0) {
            return candidate.conversation_id;
        }
    }

    return null;
}

export function normalizeMessageError(error: unknown): Error {
    const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
            ? [
                'message' in error && typeof error.message === 'string' ? error.message : null,
                'details' in error && typeof error.details === 'string' ? error.details : null,
                'hint' in error && typeof error.hint === 'string' ? error.hint : null,
              ].filter(Boolean).join(' - ') || 'Unexpected error'
            : String(error);
    if (message.includes('rate_limit_exceeded')) {
        return new Error('Slow down - max 30 messages per minute.');
    }
    if (message.toLowerCase().includes('contract chat safety violation')) {
        return new Error(message);
    }
    return error instanceof Error ? error : new Error(message);
}

export function isMissingSchemaColumn(error: unknown, tableName: string, columnName: string): boolean {
    if (!error || typeof error !== 'object') return false;
    const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return message.includes('could not find')
        && message.includes('schema cache')
        && message.includes(tableName.toLowerCase())
        && message.includes(columnName.toLowerCase());
}
