import { describe, expect, it } from 'vitest';

import {
    isImageAttachment,
    isAudioAttachment,
    formatAttachmentSize,
    getAttachmentExtensionLabel,
    extractMessageAttachmentPath,
    truncateText,
    sanitizeContractTitle,
    resolveContractSystemMessage,
    SYSTEM_MESSAGE_FALLBACKS,
    resolveSystemMessageText,
    isDeletedMessage,
    normalizeComparableUrl,
    isMissingSchemaColumnError,
    isEnumValueUnsupportedError,
    isUuidLike,
    extractRpcConversationId,
    getLifecycleBannerClassName,
} from '@/lib/messageUtils';
import {
    parseReplyMetadataFromContent,
    serializeReplyMetadataIntoContent,
} from '@/lib/messageReplies';

// ── messageReplies.ts ───────────────────────────────────────────────────────

describe('messageReplies', () => {
    describe('parseReplyMetadataFromContent', () => {
        it('parses valid reply metadata', () => {
            const payload = encodeURIComponent(JSON.stringify({
                messageId: 'msg-123',
                senderName: 'Ahmed',
                previewText: 'Hello world',
            }));
            const content = `[[reply:${payload}]] Actual message`;
            const result = parseReplyMetadataFromContent(content);
            expect(result.replyMetadata).toEqual({
                messageId: 'msg-123',
                senderName: 'Ahmed',
                previewText: 'Hello world',
            });
            expect(result.bodyText).toBe('Actual message');
        });

        it('returns null metadata for plain text', () => {
            const result = parseReplyMetadataFromContent('Just a message');
            expect(result.replyMetadata).toBeNull();
            expect(result.bodyText).toBe('Just a message');
        });

        it('returns null metadata for null input', () => {
            expect(parseReplyMetadataFromContent(null).replyMetadata).toBeNull();
        });

        it('returns null metadata for empty string', () => {
            expect(parseReplyMetadataFromContent('').replyMetadata).toBeNull();
        });

        it('returns null metadata for malformed token', () => {
            expect(parseReplyMetadataFromContent('[[reply:invalid]]').replyMetadata).toBeNull();
        });

        it('truncates long sender names', () => {
            const longName = 'A'.repeat(100);
            const payload = encodeURIComponent(JSON.stringify({
                messageId: 'msg-1',
                senderName: longName,
                previewText: 'text',
            }));
            const result = parseReplyMetadataFromContent(`[[reply:${payload}]]`);
            expect(result.replyMetadata?.senderName).not.toBe(longName);
            expect(result.replyMetadata?.senderName.length).toBeLessThanOrEqual(62);
        });
    });

    describe('serializeReplyMetadataIntoContent', () => {
        it('serializes reply metadata into content', () => {
            const result = serializeReplyMetadataIntoContent('Hello', {
                messageId: 'msg-1',
                senderName: 'Ahmed',
                previewText: 'Hi there',
            });
            expect(result).toContain('[[reply:');
            expect(result).toContain('Hello');
        });

        it('returns plain body when no metadata', () => {
            expect(serializeReplyMetadataIntoContent('Hello', null)).toBe('Hello');
        });

        it('trims body text', () => {
            expect(serializeReplyMetadataIntoContent('  Hello  ', null)).toBe('Hello');
        });
    });
});

// ── messageUtils.ts ─────────────────────────────────────────────────────────

describe('messageUtils', () => {
    describe('isImageAttachment', () => {
        it('detects image by mime type', () => {
            expect(isImageAttachment({ type: 'image/png', name: 'file' } as any)).toBe(true);
        });

        it('detects image by extension', () => {
            expect(isImageAttachment({ type: '', name: 'photo.jpg' } as any)).toBe(true);
        });

        it('returns false for non-image', () => {
            expect(isImageAttachment({ type: 'application/pdf', name: 'doc.pdf' } as any)).toBe(false);
        });
    });

    describe('isAudioAttachment', () => {
        it('detects audio by mime type', () => {
            expect(isAudioAttachment({ type: 'audio/mpeg', name: 'file' } as any)).toBe(true);
        });

        it('detects audio by extension', () => {
            expect(isAudioAttachment({ type: '', name: 'voice.mp3' } as any)).toBe(true);
        });

        it('returns false for non-audio', () => {
            expect(isAudioAttachment({ type: 'image/png', name: 'file.png' } as any)).toBe(false);
        });
    });

    describe('formatAttachmentSize', () => {
        it('formats bytes', () => {
            expect(formatAttachmentSize(500)).toBe('500 B');
        });

        it('formats kilobytes', () => {
            expect(formatAttachmentSize(2048)).toBe('2.0 KB');
        });

        it('formats megabytes', () => {
            expect(formatAttachmentSize(5 * 1024 * 1024)).toBe('5.0 MB');
        });

        it('returns null for null/undefined/0', () => {
            expect(formatAttachmentSize(null)).toBeNull();
            expect(formatAttachmentSize(undefined)).toBeNull();
            expect(formatAttachmentSize(0)).toBeNull();
        });

        it('handles string input', () => {
            expect(formatAttachmentSize('1024')).toBe('1.0 KB');
        });
    });

    describe('getAttachmentExtensionLabel', () => {
        it('extracts extension from filename', () => {
            expect(getAttachmentExtensionLabel('file.pdf', null)).toBe('PDF');
        });

        it('falls back to mime type', () => {
            expect(getAttachmentExtensionLabel(null, 'image/png')).toBe('PNG');
        });

        it('returns FILE for unknown', () => {
            expect(getAttachmentExtensionLabel(null, null)).toBe('FILE');
        });
    });

    describe('extractMessageAttachmentPath', () => {
        it('extracts path from storage URL', () => {
            const url = 'https://project.supabase.co/storage/v1/object/public/message_attachments/user123/file.pdf';
            expect(extractMessageAttachmentPath(url)).toBe('user123/file.pdf');
        });

        it('handles raw path', () => {
            expect(extractMessageAttachmentPath('user123/file.pdf')).toBe('user123/file.pdf');
        });

        it('returns null for empty', () => {
            expect(extractMessageAttachmentPath(null)).toBeNull();
        });

        it('handles path with leading slash', () => {
            expect(extractMessageAttachmentPath('/user123/file.pdf')).toBe('user123/file.pdf');
        });
    });

    describe('truncateText', () => {
        it('truncates long text', () => {
            expect(truncateText('hello world', 5)).toBe('hello...');
        });

        it('returns short text as is', () => {
            expect(truncateText('hi', 10)).toBe('hi');
        });

        it('returns empty for null', () => {
            expect(truncateText(null, 10)).toBe('');
        });
    });

    describe('sanitizeContractTitle', () => {
        it('returns title as-is', () => {
            expect(sanitizeContractTitle('My Project')).toBe('My Project');
        });

        it('strips generic titles', () => {
            expect(sanitizeContractTitle('unknown project')).toBe('');
            expect(sanitizeContractTitle('untitled job')).toBe('');
        });

        it('returns empty for empty input', () => {
            expect(sanitizeContractTitle(null)).toBe('');
        });
    });

    describe('resolveContractSystemMessage', () => {
        it('parses delivery marker', () => {
            const result = resolveContractSystemMessage('[[delivery]]');
            expect(result?.kind).toBe('delivery');
        });

        it('parses revision_requested marker', () => {
            const result = resolveContractSystemMessage('[[revision_requested]]');
            expect(result?.kind).toBe('revision_requested');
        });

        it('parses contract_completed marker', () => {
            const result = resolveContractSystemMessage('[[contract_completed]]');
            expect(result?.kind).toBe('contract_completed');
        });

        it('returns null for non-marker text', () => {
            expect(resolveContractSystemMessage('Hello')).toBeNull();
        });

        it('returns null for empty', () => {
            expect(resolveContractSystemMessage('')).toBeNull();
        });

        it('marks known fallback titles', () => {
            const result = resolveContractSystemMessage('[[delivery]] Work delivered and ready for review');
            expect(result?.isFallback).toBe(true);
        });
    });

    describe('resolveSystemMessageText', () => {
        const tx = (key: string, _params?: any, fallback?: string) => fallback ?? key;

        it('resolves known fallback text', () => {
            const result = resolveSystemMessageText('Work delivered and ready for review', 'delivery', tx);
            expect(typeof result).toBe('string');
        });

        it('returns raw text if not a fallback', () => {
            expect(resolveSystemMessageText('Custom text', 'delivery', tx)).toBe('Custom text');
        });
    });

    describe('isDeletedMessage', () => {
        it('returns true for deleted message', () => {
            expect(isDeletedMessage({ is_deleted: true } as any)).toBe(true);
        });

        it('returns false for non-deleted', () => {
            expect(isDeletedMessage({ is_deleted: false } as any)).toBe(false);
        });

        it('returns false for null', () => {
            expect(isDeletedMessage(null)).toBe(false);
        });
    });

    describe('normalizeComparableUrl', () => {
        it('strips query and hash', () => {
            expect(normalizeComparableUrl('https://example.com/path?q=1#hash')).toBe('https://example.com/path');
        });

        it('strips trailing slashes', () => {
            expect(normalizeComparableUrl('https://example.com/path/')).toBe('https://example.com/path');
        });
    });

    describe('isMissingSchemaColumnError', () => {
        it('detects schema cache error', () => {
            expect(isMissingSchemaColumnError(
                { message: 'could not find column jobs.job_reference_links in schema cache' },
                'jobs',
                'job_reference_links',
            )).toBe(true);
        });

        it('detects does not exist error', () => {
            expect(isMissingSchemaColumnError(
                { message: 'column jobs.missing_col does not exist' },
                'jobs',
                'missing_col',
            )).toBe(true);
        });

        it('returns false for unrelated error', () => {
            expect(isMissingSchemaColumnError(
                { message: 'something else' },
                'jobs',
                'col',
            )).toBe(false);
        });

        it('returns false for null', () => {
            expect(isMissingSchemaColumnError(null, 'jobs', 'col')).toBe(false);
        });
    });

    describe('isEnumValueUnsupportedError', () => {
        it('detects enum error', () => {
            expect(isEnumValueUnsupportedError(
                { message: 'invalid input value for enum contract_status: invalid_val' },
                'contract_status',
                'invalid_val',
            )).toBe(true);
        });

        it('returns false for unrelated', () => {
            expect(isEnumValueUnsupportedError({ message: 'other' }, 'enum', 'val')).toBe(false);
        });

        it('returns false for null', () => {
            expect(isEnumValueUnsupportedError(null, 'enum', 'val')).toBe(false);
        });
    });

    describe('isUuidLike', () => {
        it('validates UUID', () => {
            expect(isUuidLike('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        });

        it('rejects non-UUID', () => {
            expect(isUuidLike('not-a-uuid')).toBe(false);
        });

        it('returns false for null', () => {
            expect(isUuidLike(null)).toBe(false);
        });
    });

    describe('extractRpcConversationId', () => {
        it('extracts from string', () => {
            expect(extractRpcConversationId('conv-123')).toBe('conv-123');
        });

        it('extracts from object with id', () => {
            expect(extractRpcConversationId({ id: 'conv-456' })).toBe('conv-456');
        });

        it('extracts from object with conversation_id', () => {
            expect(extractRpcConversationId({ conversation_id: 'conv-789' })).toBe('conv-789');
        });

        it('returns null for null', () => {
            expect(extractRpcConversationId(null)).toBeNull();
        });

        it('returns null for empty object', () => {
            expect(extractRpcConversationId({})).toBeNull();
        });
    });

    describe('getLifecycleBannerClassName', () => {
        it('returns emerald for success', () => {
            expect(getLifecycleBannerClassName('success')).toContain('emerald');
        });

        it('returns amber for warning', () => {
            expect(getLifecycleBannerClassName('warning')).toContain('amber');
        });

        it('returns red for danger', () => {
            expect(getLifecycleBannerClassName('danger')).toContain('red');
        });

        it('returns blue for info', () => {
            expect(getLifecycleBannerClassName('info')).toContain('blue');
        });

        it('returns default for none', () => {
            expect(getLifecycleBannerClassName('none')).toContain('border-surface');
        });
    });
});
