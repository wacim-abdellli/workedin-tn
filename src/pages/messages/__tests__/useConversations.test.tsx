import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useConversations } from '../useConversations';
import type { Conversation } from '../../../services/messages';

const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();
let mockLocationState: any = null;

vi.mock('react-router-dom', () => ({
    useLocation: () => ({ state: mockLocationState }),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
}));

const mockGetConversations = vi.fn();
const mockSubscribeToConversations = vi.fn(() => ({ unsubscribe: vi.fn() }));
const mockSortByActivity = vi.fn((arr: any[]) => arr);
const mockIsMissingSchemaColumnError = vi.fn(() => false);
const mockIsUuidLike = vi.fn((_id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(_id));
const mockExtractRpcConversationId = vi.fn((_data: any) => null);
const mockPrefetchConvMessages = vi.fn();

vi.mock('../../../services/messages', () => ({
    getConversations: (...args: any[]) => mockGetConversations(...args),
    subscribeToConversations: (...args: any[]) => mockSubscribeToConversations(...args),
}));

vi.mock('../../../lib/messageUtils', () => ({
    sortConversationsByActivity: (...args: any[]) => mockSortByActivity(...args),
    isMissingSchemaColumnError: (...args: any[]) => mockIsMissingSchemaColumnError(...args),
    isUuidLike: (...args: any[]) => mockIsUuidLike(args[0]),
    extractRpcConversationId: (...args: any[]) => mockExtractRpcConversationId(...args),
}));

let supabaseFromImpl = vi.fn();

vi.mock('../../../lib/supabase', () => ({
    supabase: {
        from: (...args: any[]) => supabaseFromImpl(...args),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

vi.mock('../../../i18n', () => ({
    useTranslation: () => ({
        t: {},
        tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
        language: 'en',
        dir: 'ltr',
    }),
}));

function makeConv(overrides: Partial<Conversation> = {}): Conversation {
    return {
        id: 'conv-1',
        participant_1: 'user-1',
        participant_2: 'user-2',
        client_id: 'client-1',
        freelancer_id: 'freelancer-1',
        status: 'active',
        contract_id: null,
        last_message_text: null,
        last_message_at: null,
        unread_count_1: 0,
        unread_count_2: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        conversation_scope: 'shared',
        inbox_participant_1: undefined,
        inbox_participant_2: undefined,
        otherUser: {
            id: 'user-2',
            full_name: 'Other User',
            avatar_url: null,
            username: null,
        },
        unread_count: 0,
        ...overrides,
    };
}

const defaultProps = {
    user: { id: 'user-1' },
    activeMode: 'freelancer' as string | null | undefined,
    profile: { active_mode: 'freelancer' },
    showToast: vi.fn(),
    tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
    prefetchConversationMessages: mockPrefetchConvMessages,
    setShowMobileThread: vi.fn(),
    setShowConversationsList: vi.fn(),
    setShowContractPanel: vi.fn(),
};

describe('useConversations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocationState = null;
        mockSearchParams.delete('contract');
        mockSearchParams.delete('with');
        mockSearchParams.delete('conversation');
        mockGetConversations.mockResolvedValue({ data: [], count: 0, error: null });
        supabaseFromImpl = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            in: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initializes with loading state', () => {
        const { result } = renderHook(() => useConversations(defaultProps));
        expect(result.current.isLoadingConversations).toBe(true);
        expect(result.current.conversations).toEqual([]);
        expect(result.current.selectedConversation).toBeNull();
    });

    it('loads conversations on mount', async () => {
        const convs = [makeConv()];
        mockGetConversations.mockResolvedValue({ data: convs, count: 1, error: null });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        expect(result.current.conversations).toEqual(convs);
    });

    it('handles load conversations error', async () => {
        mockGetConversations.mockResolvedValue({ data: null, count: 0, error: new Error('Network error') });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        expect(result.current.conversations).toEqual([]);
        expect(defaultProps.showToast).toHaveBeenCalledWith('Network error', 'error');
    });

    it('selects a conversation', async () => {
        const convs = [makeConv({ id: 'conv-1' }), makeConv({ id: 'conv-2' })];
        mockGetConversations.mockResolvedValue({ data: convs, count: 2, error: null });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        act(() => { result.current.handleSelectConversation(convs[1]); });
        expect(result.current.selectedConversation?.id).toBe('conv-2');
        expect(defaultProps.setShowMobileThread).toHaveBeenCalledWith(true);
        expect(defaultProps.setShowConversationsList).toHaveBeenCalledWith(false);
        expect(defaultProps.setShowContractPanel).toHaveBeenCalledWith(false);
    });

    it('archives a conversation', async () => {
        const convs = [makeConv({ id: 'conv-1' })];
        mockGetConversations.mockResolvedValue({ data: convs, count: 1, error: null });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        act(() => { result.current.handleSelectConversation(convs[0]); });
        act(() => { result.current.archiveConversation('conv-1'); });
        expect(result.current.archivedConversationIds.has('conv-1')).toBe(true);
        expect(result.current.selectedConversation).toBeNull();
    });

    it('unarchives a conversation', async () => {
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        act(() => { result.current.unarchiveConversation('conv-1'); });
        expect(result.current.unarchivedConversationIds.has('conv-1')).toBe(true);
        expect(result.current.archivedConversationIds.has('conv-1')).toBe(false);
    });

    it('loads more conversations on onLoadMore', async () => {
        mockGetConversations.mockResolvedValue({ data: [], count: 0, error: null });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        expect(result.current.page).toBe(0);
        act(() => { result.current.onLoadMore(); });
        expect(result.current.page).toBe(1);
    });

    it('resets page on filter change', async () => {
        mockGetConversations.mockResolvedValue({ data: [], count: 0, error: null });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        act(() => { result.current.setPage(3); });
        act(() => { result.current.setFilter('unread'); });
        expect(result.current.page).toBe(0);
    });

    it('handles undefined activeMode', () => {
        const { result } = renderHook(() => useConversations({ ...defaultProps, activeMode: undefined }));
        expect(result.current.isLoadingConversations).toBe(true);
    });

    it('handles client mode', () => {
        const { result } = renderHook(() => useConversations({
            ...defaultProps,
            activeMode: 'client',
            profile: { active_mode: 'client' },
        }));
        expect(result.current.isLoadingConversations).toBe(true);
    });

    it('resets loading state when user switches modes', async () => {
        mockGetConversations.mockResolvedValueOnce({ data: [], count: 0, error: null });
        const { result, rerender } = renderHook(
            (props: any) => useConversations(props),
            { initialProps: defaultProps }
        );
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        rerender({ ...defaultProps, activeMode: 'client', profile: { active_mode: 'client' }, user: { id: 'user-1' } });
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(true); });
    });

    it('handles bootstrap with valid contract route', async () => {
        const contractId = '550e8400-e29b-41d4-a716-446655440000';
        mockSearchParams.set('contract', contractId);
        mockSearchParams.set('with', 'user-2');
        // No existing conversations match the contract, triggering full bootstrap
        mockGetConversations.mockResolvedValue({ data: [], count: 0, error: null });
        supabaseFromImpl = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            in: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
        });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(true); });
    });

    it('computes conversationSummaryLabel with unread', async () => {
        const convs = [
            makeConv({ id: 'conv-1', unread_count: 3 }),
            makeConv({ id: 'conv-2', unread_count: 0 }),
        ];
        mockGetConversations.mockResolvedValue({ data: convs, count: 2, error: null });
        const { result } = renderHook(() => useConversations(defaultProps));
        await waitFor(() => { expect(result.current.isLoadingConversations).toBe(false); });
        expect(result.current.conversationSummaryLabel).toContain('unread');
    });
});
