import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/useAudioRecorder', () => ({
    useAudioRecorder: () => ({
        isRecording: false, recordingTime: 0,
        startRecording: vi.fn(), stopRecording: vi.fn(), cancelRecording: vi.fn(),
        audioBlob: null, error: null,
    }),
}));
vi.mock('../../../hooks/useTypingIndicator', () => ({
    useTypingIndicator: () => ({ typingUsers: [], startTyping: vi.fn(), stopTyping: vi.fn() }),
}));
vi.mock('../../../hooks/useReadReceipts', () => ({ useReadReceipts: vi.fn() }));
vi.mock('../../../lib/audioProcessing', () => ({
    fileToBase64: vi.fn(), blobToBase64: vi.fn(), buildVoiceMemoFile: vi.fn(),
}));
vi.mock('../../../services/messages', () => ({
    getMessages: vi.fn().mockResolvedValue({ data: [], error: null }),
    deleteMessage: vi.fn(),
    sendMessage: vi.fn(),
    markConversationRead: vi.fn().mockResolvedValue({ error: null }),
    subscribeToConversation: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
}));
vi.mock('../../../lib/messageUtils', () => ({
    getThreadPreview: vi.fn().mockReturnValue({}),
}));
vi.mock('../../../lib/messageReplies', () => ({
    serializeReplyMetadataIntoContent: (body: string) => body,
}));
vi.mock('../../../lib/contractChatSafety', () => ({
    detectContractChatSafetyRisk: vi.fn().mockReturnValue({ blocked: false }),
}));

import { useMessageThread } from '../useMessageThread';

function makeConv(overrides: any = {}): any {
    return { id: 'conv-1', otherUser: { id: 'user-2', full_name: 'Bob', avatar_url: null }, contract_id: null, unread_count: 0, last_message_text: null, last_message_at: null, ...overrides };
}
function makeMsg(overrides: any = {}): any {
    return { id: 'msg-1', conversation_id: 'conv-1', sender_id: 'user-1', receiver_id: 'user-2', content: 'Hello', attachments: [], is_read: false, created_at: new Date().toISOString(), contract_id: null, proposal_id: null, status: undefined, sender: { id: 'user-1', full_name: 'Me', avatar_url: null }, ...overrides };
}
function props(overrides: any = {}) {
    return { user: { id: 'user-1' }, profile: { full_name: 'Me', avatar_url: null }, selectedConversation: null, setConversations: vi.fn(), selectedConversationPolicy: null, showToast: vi.fn(), tx: (_k: string, _p?: any, f?: string) => f || _k, isOnline: true, ...overrides };
}

describe('useMessageThread (no selectedConversation)', () => {
    it('initializes with default state', () => {
        const { result } = renderHook(() => useMessageThread(props()));
        expect(result.current.messages).toEqual([]);
        expect(result.current.newMessage).toBe('');
        expect(result.current.isLoadingMessages).toBe(false);
        expect(result.current.isSending).toBe(false);
        expect(result.current.uploadProgress).toBe(0);
        expect(result.current.deletingMessageId).toBeNull();
        expect(result.current.replyTarget).toBeNull();
        expect(result.current.selectedFile).toBeNull();
        expect(result.current.pendingQueue).toEqual([]);
    });

    it('handleDeleteMessage returns early without selectedConversation', () => {
        const { result } = renderHook(() => useMessageThread(props()));
        result.current.handleDeleteMessage(makeMsg({ sender_id: 'user-1' }));
        expect(result.current.messagePendingDelete).toBeNull();
    });

    it('prefetchConversationMessages is callable', () => {
        const { result } = renderHook(() => useMessageThread(props()));
        expect(typeof result.current.prefetchConversationMessages).toBe('function');
    });

    it('handleReplyToMessage is callable', () => {
        const { result } = renderHook(() => useMessageThread(props()));
        expect(typeof result.current.handleReplyToMessage).toBe('function');
    });

    it('scrollToMessageById is callable', () => {
        const { result } = renderHook(() => useMessageThread(props()));
        expect(typeof result.current.scrollToMessageById).toBe('function');
    });
});
