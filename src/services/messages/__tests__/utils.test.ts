import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    buildMessageAttachmentPath,
    getConversationCacheKey,
    extractConversationIdFromRpcPayload,
    normalizeMessageError,
    isMissingSchemaColumn,
} from '../utils';

describe('messages/utils', () => {
    describe('buildMessageAttachmentPath', () => {
        it('builds a path with conversation ID and safe filename', () => {
            const path = buildMessageAttachmentPath('conv-1', 'photo.jpg');
            expect(path).toMatch(/^conv-1\/[\w-]+-photo\.jpg$/);
        });

        it('sanitizes special characters in filename', () => {
            const path = buildMessageAttachmentPath('conv-1', 'my file (1).png');
            expect(path).toMatch(/my_file__1_\.png$/);
        });

        it('uses crypto.randomUUID when available', () => {
            const path = buildMessageAttachmentPath('c', 'f.txt');
            // UUID pattern: 8-4-4-4-12 hex chars
            expect(path).toMatch(/^c\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-f\.txt$/);
        });
    });

    describe('getConversationCacheKey', () => {
        it('sorts user IDs for deterministic keys', () => {
            const key1 = getConversationCacheKey('a', 'b');
            const key2 = getConversationCacheKey('b', 'a');
            expect(key1).toBe(key2);
        });

        it('includes contract ID when provided', () => {
            const key = getConversationCacheKey('a', 'b', 'contract-1');
            expect(key).toContain('contract-1');
        });

        it('uses "none" when contract ID is null', () => {
            const key = getConversationCacheKey('a', 'b', null);
            expect(key).toContain('none');
        });

        it('includes scope when provided', () => {
            const key = getConversationCacheKey('a', 'b', null, 'client');
            expect(key).toContain('client');
        });

        it('uses "auto" when scope is null', () => {
            const key = getConversationCacheKey('a', 'b', null, null);
            expect(key).toContain('auto');
        });
    });

    describe('extractConversationIdFromRpcPayload', () => {
        it('returns string payload directly', () => {
            expect(extractConversationIdFromRpcPayload('conv-1')).toBe('conv-1');
        });

        it('returns null for empty string', () => {
            expect(extractConversationIdFromRpcPayload('')).toBeNull();
        });

        it('returns null for whitespace-only string', () => {
            expect(extractConversationIdFromRpcPayload('   ')).toBeNull();
        });

        it('extracts id from object payload', () => {
            expect(extractConversationIdFromRpcPayload({ id: 'conv-2' })).toBe('conv-2');
        });

        it('extracts conversation_id from object payload', () => {
            expect(extractConversationIdFromRpcPayload({ conversation_id: 'conv-3' })).toBe('conv-3');
        });

        it('prefers id over conversation_id', () => {
            expect(extractConversationIdFromRpcPayload({ id: 'conv-a', conversation_id: 'conv-b' })).toBe('conv-a');
        });

        it('returns null for non-string id', () => {
            expect(extractConversationIdFromRpcPayload({ id: 123 })).toBeNull();
        });

        it('returns null for null payload', () => {
            expect(extractConversationIdFromRpcPayload(null)).toBeNull();
        });

        it('returns null for number payload', () => {
            expect(extractConversationIdFromRpcPayload(42)).toBeNull();
        });
    });

    describe('normalizeMessageError', () => {
        it('wraps Error instances as-is', () => {
            const err = new Error('test error');
            expect(normalizeMessageError(err)).toBe(err);
        });

        it('wraps string errors into Error', () => {
            const result = normalizeMessageError('something broke');
            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('something broke');
        });

        it('extracts message from object errors', () => {
            const result = normalizeMessageError({ message: 'db error', details: 'table missing', hint: 'run migration' });
            expect(result.message).toContain('db error');
        });

        it('returns "Unexpected error" for empty objects', () => {
            const result = normalizeMessageError({});
            expect(result.message).toBe('Unexpected error');
        });

        it('handles rate_limit_exceeded specially', () => {
            const result = normalizeMessageError('rate_limit_exceeded');
            expect(result.message).toContain('Slow down');
        });

        it('preserves contract chat safety violation messages', () => {
            const result = normalizeMessageError('Contract chat safety violation detected');
            expect(result.message).toContain('Contract chat safety violation');
        });

        it('wraps number errors', () => {
            const result = normalizeMessageError(404);
            expect(result).toBeInstanceOf(Error);
        });
    });

    describe('isMissingSchemaColumn', () => {
        it('returns true for matching schema cache errors', () => {
            expect(isMissingSchemaColumn(
                { message: 'Could not find the column public.conversations.status in the schema cache' },
                'conversations',
                'status'
            )).toBe(true);
        });

        it('returns false for non-matching errors', () => {
            expect(isMissingSchemaColumn(
                { message: 'Some other error' },
                'conversations',
                'status'
            )).toBe(false);
        });

        it('returns false for null error', () => {
            expect(isMissingSchemaColumn(null, 'conversations', 'status')).toBe(false);
        });

        it('returns false for string errors', () => {
            expect(isMissingSchemaColumn('not an object', 'conversations', 'status')).toBe(false);
        });

        it('is case-insensitive', () => {
            expect(isMissingSchemaColumn(
                { message: 'Could Not Find The Column PUBLIC.CONVERSATIONS.STATUS In The Schema Cache' },
                'conversations',
                'status'
            )).toBe(true);
        });
    });
});
