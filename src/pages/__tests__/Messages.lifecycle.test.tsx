import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const routeMocks = vi.hoisted(() => ({
    navigate: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
    showToast: vi.fn(),
}));

const messageServiceMocks = vi.hoisted(() => ({
    getConversations: vi.fn(),
    getMessages: vi.fn(),
    deleteMessage: vi.fn(),
    sendMessage: vi.fn(),
    uploadMessageAttachment: vi.fn(),
    markConversationRead: vi.fn(),
    subscribeToConversation: vi.fn(),
    subscribeToConversations: vi.fn(),
}));

const supabaseState = vi.hoisted(() => ({
    contractRows: [] as Array<{
        id: string;
        status: string | null;
        title?: string | null;
        amount?: number | null;
        total_amount?: number | null;
        client_id?: string | null;
        freelancer_id?: string | null;
        job_id?: string | null;
        proposal_id?: string | null;
        created_at?: string | null;
    }>,
    proposalRows: [] as Array<{
        id: string;
        job_id: string | null;
        freelancer_id?: string | null;
        status?: string | null;
        created_at?: string | null;
    }>,
    jobRows: [] as Array<{ id: string; title: string | null; client_id?: string | null }>,
    contractError: null as { message: string } | null,
    contractMissingTotalAmountError: false,
    fromCalls: [] as string[],
    requestedContractIds: [] as string[][],
    requestedProposalIds: [] as string[][],
    requestedJobIds: [] as string[][],
    contractSelectColumns: [] as string[],
    channelNames: [] as string[],
}));

const audioRecorderMocks = vi.hoisted(() => ({
    state: {
        isRecording: false,
        recordingTime: 0,
        audioBlob: null as Blob | null,
        error: null as Error | null,
    },
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    cancelRecording: vi.fn(),
}));

const typingMocks = vi.hoisted(() => ({
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
    state: {
        activeMode: 'client' as 'client' | 'freelancer',
    },
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => routeMocks.navigate,
    };
});

vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: ({ count }: { count: number }) => ({
        getTotalSize: () => count * 120,
        getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
            index,
            key: index,
            size: 120,
            start: index * 120,
        })),
        scrollToIndex: vi.fn(),
        measureElement: vi.fn(),
    }),
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        language: 'en',
        tx: (_key: string, _params?: Record<string, string | number>, fallback?: string) => fallback ?? _key,
    }),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1' },
        profile: { active_mode: authMocks.state.activeMode },
        activeMode: authMocks.state.activeMode,
    }),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: toastMocks.showToast }),
}));

vi.mock('@/services/messages', () => ({
    getConversations: messageServiceMocks.getConversations,
    getMessages: messageServiceMocks.getMessages,
    deleteMessage: messageServiceMocks.deleteMessage,
    sendMessage: messageServiceMocks.sendMessage,
    uploadMessageAttachment: messageServiceMocks.uploadMessageAttachment,
    markConversationRead: messageServiceMocks.markConversationRead,
    subscribeToConversation: messageServiceMocks.subscribeToConversation,
    subscribeToConversations: messageServiceMocks.subscribeToConversations,
}));

vi.mock('@/hooks/useAudioRecorder', () => ({
    useAudioRecorder: () => ({
        isRecording: audioRecorderMocks.state.isRecording,
        recordingTime: audioRecorderMocks.state.recordingTime,
        startRecording: audioRecorderMocks.startRecording,
        stopRecording: audioRecorderMocks.stopRecording,
        cancelRecording: audioRecorderMocks.cancelRecording,
        audioBlob: audioRecorderMocks.state.audioBlob,
        error: audioRecorderMocks.state.error,
    }),
}));

vi.mock('@/hooks/useTypingIndicator', () => ({
    useTypingIndicator: () => ({
        typingUsers: [],
        startTyping: typingMocks.startTyping,
        stopTyping: typingMocks.stopTyping,
    }),
}));

vi.mock('@/hooks/useReadReceipts', () => ({
    useReadReceipts: () => null,
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn((table: string) => {
            supabaseState.fromCalls.push(table);
            let selectedColumns = '';

            const builder = {
                select: vi.fn((columns?: string) => {
                    selectedColumns = typeof columns === 'string' ? columns : '';
                    if (table === 'contracts' && selectedColumns) {
                        supabaseState.contractSelectColumns.push(selectedColumns);
                    }
                    return builder;
                }),
                in: vi.fn(async (column: string, ids: string[]) => {
                    if (table === 'contracts') {
                        supabaseState.requestedContractIds.push([...ids]);

                        if (
                            supabaseState.contractMissingTotalAmountError
                            && selectedColumns.includes('total_amount')
                        ) {
                            return {
                                data: null,
                                error: { message: 'column contracts.total_amount does not exist' },
                            };
                        }

                        if (supabaseState.contractError) {
                            return { data: null, error: supabaseState.contractError };
                        }

                        return {
                            data: supabaseState.contractRows.filter((row) => {
                                if (column === 'id') return ids.includes(row.id);
                                if (column === 'proposal_id') return ids.includes(row.proposal_id || '');
                                if (column === 'job_id') return ids.includes(row.job_id || '');
                                if (column === 'client_id') return ids.includes(row.client_id || '');
                                if (column === 'freelancer_id') return ids.includes(row.freelancer_id || '');
                                return false;
                            }),
                            error: null,
                        };
                    }

                    if (table === 'proposals') {
                        supabaseState.requestedProposalIds.push([...ids]);
                        return {
                            data: supabaseState.proposalRows.filter((row) => {
                                if (column === 'id') return ids.includes(row.id);
                                if (column === 'freelancer_id') return ids.includes(row.freelancer_id || '');
                                return false;
                            }),
                            error: null,
                        };
                    }

                    if (table === 'jobs') {
                        supabaseState.requestedJobIds.push([...ids]);
                        return {
                            data: supabaseState.jobRows.filter((row) => {
                                if (column === 'id') return ids.includes(row.id);
                                return false;
                            }),
                            error: null,
                        };
                    }

                    throw new Error(`Unexpected supabase table access in Messages lifecycle test: ${table}`);
                }),
                eq: vi.fn(() => builder),
                order: vi.fn(() => builder),
                limit: vi.fn(() => builder),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
                then: vi.fn((resolve: (v: unknown) => unknown) => Promise.resolve(resolve({ data: [], error: null }))),
            };

            return builder;
        }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        channel: vi.fn((name: string) => {
            supabaseState.channelNames.push(name);

            const channel = {
                on: vi.fn(() => channel),
                subscribe: vi.fn(() => channel),
                unsubscribe: vi.fn(),
                send: vi.fn(),
            };

            return channel;
        }),
        removeChannel: vi.fn().mockResolvedValue(undefined),
        storage: {
            from: vi.fn(() => ({
                download: vi.fn().mockResolvedValue({ data: null, error: null }),
                getPublicUrl: vi.fn((path: string) => ({
                    data: { publicUrl: `https://storage.example/${path}` },
                })),
            })),
        },
    },
    supabaseAnon: {
        from: vi.fn(() => {
            const anonBuilder: Record<string, unknown> = {};
            const fluent = () => anonBuilder;
            anonBuilder.select = vi.fn(fluent);
            anonBuilder.eq = vi.fn(fluent);
            anonBuilder.order = vi.fn(fluent);
            anonBuilder.single = vi.fn().mockResolvedValue({ data: null, error: null });
            anonBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            return anonBuilder;
        }),
    },
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('@/components/common/SEO', () => ({
    __esModule: true,
    default: () => null,
    SEO_CONFIG: {
        messages: {
            title: 'Messages',
            description: 'Messages page',
        },
    },
}));

vi.mock('@/components/ui/Modal', () => ({
    __esModule: true,
    default: ({
        isOpen,
        title,
        children,
    }: {
        isOpen: boolean;
        title?: string;
        children: ReactNode;
    }) => (isOpen ? <div><h2>{title}</h2>{children}</div> : null),
}));

vi.mock('@/components/ui/Button', () => ({
    __esModule: true,
    default: ({
        children,
        onClick,
        disabled,
        type = 'button',
    }: {
        children: ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
    }) => (
        <button type={type} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}));

import Messages from '@/pages/Messages';

function createConversation({
    id,
    name,
    contractId = null,
    otherUserId = 'other-user-1',
    participant1 = 'user-1',
    participant2,
    conversationScope,
    inboxParticipant1,
    inboxParticipant2,
}: {
    id: string;
    name: string;
    contractId?: string | null;
    otherUserId?: string;
    participant1?: string;
    participant2?: string;
    conversationScope?: 'client' | 'freelancer' | 'contract' | 'shared';
    inboxParticipant1?: 'client' | 'freelancer' | 'contract' | 'shared';
    inboxParticipant2?: 'client' | 'freelancer' | 'contract' | 'shared';
}) {
    const resolvedParticipant2 = participant2 ?? (
        participant1 === 'user-1'
            ? otherUserId
            : 'user-1'
    );

    return {
        id,
        participant_1: participant1,
        participant_2: resolvedParticipant2,
        contract_id: contractId,
        last_message_text: `Preview for ${name}`,
        last_message_at: '2026-04-15T10:00:00.000Z',
        unread_count_1: 0,
        unread_count_2: 0,
        unread_count: 0,
        created_at: '2026-04-14T10:00:00.000Z',
        updated_at: '2026-04-15T10:00:00.000Z',
        conversation_scope: conversationScope ?? (contractId ? 'contract' : 'shared'),
        inbox_participant_1: inboxParticipant1,
        inbox_participant_2: inboxParticipant2,
        otherUser: {
            id: otherUserId,
            full_name: name,
            avatar_url: null,
            username: `${name.toLowerCase().replace(/\s+/g, '-')}-username`,
        },
        message_count: 1,
    };
}

function createMessage({
    id,
    conversationId,
    content,
    senderId = 'other-user-1',
    receiverId = 'user-1',
    contractId = null,
}: {
    id: string;
    conversationId: string;
    content: string;
    senderId?: string;
    receiverId?: string;
    contractId?: string | null;
}) {
    return {
        id,
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        attachments: [],
        is_read: senderId === 'user-1',
        created_at: '2026-04-15T10:05:00.000Z',
        contract_id: contractId,
        proposal_id: null,
        sender: {
            id: senderId,
            full_name: senderId === 'user-1' ? 'You' : 'Other User',
            avatar_url: null,
        },
    };
}

function setScenario({
    conversation,
    threadMessages,
    contractRows = [],
    proposalRows = [],
    jobRows = [],
}: {
    conversation: ReturnType<typeof createConversation>;
    threadMessages: Array<ReturnType<typeof createMessage>>;
    contractRows?: Array<{
        id: string;
        status: string | null;
        title?: string | null;
        amount?: number | null;
        total_amount?: number | null;
        client_id?: string | null;
        freelancer_id?: string | null;
        job_id?: string | null;
        proposal_id?: string | null;
        created_at?: string | null;
    }>;
    proposalRows?: Array<{
        id: string;
        job_id: string | null;
        freelancer_id?: string | null;
        status?: string | null;
        created_at?: string | null;
    }>;
    jobRows?: Array<{ id: string; title: string | null; client_id?: string | null }>;
}) {
    supabaseState.contractRows = contractRows;
    supabaseState.proposalRows = proposalRows;
    supabaseState.jobRows = jobRows;

    messageServiceMocks.getConversations.mockResolvedValue({
        data: [conversation],
        count: 1,
        error: null,
    });

    messageServiceMocks.getMessages.mockImplementation(async (conversationId: string) => ({
        data: conversationId === conversation.id ? threadMessages : [],
        error: null,
    }));
}

function renderMessages(route: string) {
    return render(
        <HelmetProvider>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="/messages" element={<Messages />} />
                </Routes>
            </MemoryRouter>
        </HelmetProvider>
    );
}

async function renderSelectedScenario({
    conversation,
    threadMessages,
    contractRows = [],
    proposalRows = [],
    jobRows = [],
}: {
    conversation: ReturnType<typeof createConversation>;
    threadMessages: Array<ReturnType<typeof createMessage>>;
    contractRows?: Array<{
        id: string;
        status: string | null;
        title?: string | null;
        amount?: number | null;
        total_amount?: number | null;
        client_id?: string | null;
        freelancer_id?: string | null;
        job_id?: string | null;
        proposal_id?: string | null;
        created_at?: string | null;
    }>;
    proposalRows?: Array<{
        id: string;
        job_id: string | null;
        freelancer_id?: string | null;
        status?: string | null;
        created_at?: string | null;
    }>;
    jobRows?: Array<{ id: string; title: string | null; client_id?: string | null }>;
}) {
    setScenario({ conversation, threadMessages, contractRows, proposalRows, jobRows });
    const view = renderMessages(`/messages?conversation=${conversation.id}`);

    await waitFor(() => {
        expect(messageServiceMocks.getMessages).toHaveBeenCalledWith(conversation.id);
    });

    if (threadMessages.length > 0) {
        const lastMsg = threadMessages[threadMessages.length - 1];
        await screen.findAllByText(lastMsg.content);
    }

    return view;
}

describe('Messages lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        authMocks.state.activeMode = 'client';

        Object.defineProperty(URL, 'createObjectURL', {
            writable: true,
            value: vi.fn(() => 'blob:mock-audio-preview'),
        });

        Object.defineProperty(URL, 'revokeObjectURL', {
            writable: true,
            value: vi.fn(),
        });

        if (!HTMLElement.prototype.scrollTo) {
            HTMLElement.prototype.scrollTo = vi.fn();
        }

        supabaseState.contractRows = [];
        supabaseState.proposalRows = [];
        supabaseState.jobRows = [];
        supabaseState.contractError = null;
        supabaseState.contractMissingTotalAmountError = false;
        supabaseState.fromCalls = [];
        supabaseState.requestedContractIds = [];
        supabaseState.requestedProposalIds = [];
        supabaseState.requestedJobIds = [];
        supabaseState.contractSelectColumns = [];
        supabaseState.channelNames = [];

        audioRecorderMocks.state.isRecording = false;
        audioRecorderMocks.state.recordingTime = 0;
        audioRecorderMocks.state.audioBlob = null;
        audioRecorderMocks.state.error = null;

        audioRecorderMocks.startRecording.mockResolvedValue(undefined);
        audioRecorderMocks.stopRecording.mockImplementation(() => {
            audioRecorderMocks.state.audioBlob = null;
        });
        audioRecorderMocks.cancelRecording.mockImplementation(() => {
            audioRecorderMocks.state.audioBlob = null;
        });

        typingMocks.startTyping.mockImplementation(() => undefined);
        typingMocks.stopTyping.mockImplementation(() => undefined);

        messageServiceMocks.getConversations.mockResolvedValue({
            data: [],
            count: 0,
            error: null,
        });
        messageServiceMocks.getMessages.mockResolvedValue({ data: [], error: null });
        messageServiceMocks.deleteMessage.mockResolvedValue({ data: null, error: null });
        messageServiceMocks.sendMessage.mockImplementation(async (params: {
            conversationId: string;
            senderId: string;
            receiverId: string;
            content: string;
            contractId?: string | null;
            attachments?: unknown[];
        }) => ({
            data: createMessage({
                id: `server-message-${params.conversationId}`,
                conversationId: params.conversationId,
                senderId: params.senderId,
                receiverId: params.receiverId,
                content: params.content,
                contractId: params.contractId ?? null,
            }),
            error: null,
        }));
        messageServiceMocks.uploadMessageAttachment.mockResolvedValue({
            url: 'https://files.example/uploaded.pdf',
            error: null,
        });
        messageServiceMocks.markConversationRead.mockResolvedValue({ error: null });
        messageServiceMocks.subscribeToConversation.mockReturnValue({ unsubscribe: vi.fn() });
        messageServiceMocks.subscribeToConversations.mockReturnValue({ unsubscribe: vi.fn() });
    });

    it('keeps direct conversations writable without contract lifecycle UI', async () => {
        const conversation = createConversation({
            id: 'conv-direct',
            name: 'Direct User',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-direct',
                conversationId: conversation.id,
                content: 'Direct thread message',
            }),
        ];

        await renderSelectedScenario({ conversation, threadMessages });

        expect(screen.queryByRole('button', { name: /View workspace/i })).not.toBeInTheDocument();
        expect(screen.queryByText('This contract is completed. The thread is now read-only.')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Reply to message' })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Type a message...'), {
            target: { value: 'Hello direct lifecycle' },
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

        await waitFor(() => {
            expect(messageServiceMocks.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                conversationId: 'conv-direct',
                senderId: 'user-1',
                receiverId: 'other-user-1',
                content: 'Hello direct lifecycle',
                contractId: null,
            }));
        });

        expect(supabaseState.fromCalls).toEqual([]);
    });

    it('keeps active contract conversations writable without a lifecycle banner', async () => {
        const conversation = createConversation({
            id: 'conv-active',
            name: 'Active Contract User',
            contractId: 'contract-active',
            otherUserId: 'freelancer-1',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-active',
                conversationId: conversation.id,
                content: 'Active contract thread message',
                senderId: 'freelancer-1',
                receiverId: 'user-1',
                contractId: 'contract-active',
            }),
        ];

        await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [{ id: 'contract-active', status: 'active' }],
        });

        await waitFor(() => {
            expect(supabaseState.requestedContractIds).toEqual(expect.arrayContaining([['contract-active']]));
        });

        await waitFor(() => {
            expect(screen.queryByText('Contract status is currently unavailable. Messaging remains open.')).not.toBeInTheDocument();
        });

        // The Workspace toggle button is rendered in the header
        expect(screen.getByRole('button', { name: /Workspace/i })).toBeInTheDocument();
        expect(screen.queryByText('Payment is still being confirmed for this contract. Messaging remains open.')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Attach file' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Start recording' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
        expect(audioRecorderMocks.startRecording).toHaveBeenCalledTimes(1);
    });

    it('resolves the contract title from the proposal job when the contract row has no job_id', async () => {
        const conversation = createConversation({
            id: 'conv-proposal-fallback',
            name: 'Proposal Linked User',
            contractId: 'contract-proposal-fallback',
            otherUserId: 'freelancer-2',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-proposal-fallback',
                conversationId: conversation.id,
                content: 'Proposal linked contract thread message',
                senderId: 'freelancer-2',
                receiverId: 'user-1',
                contractId: 'contract-proposal-fallback',
            }),
        ];

        await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [{
                id: 'contract-proposal-fallback',
                status: 'active',
                title: null,
                job_id: null,
                proposal_id: 'proposal-42',
                created_at: '2026-04-15T09:00:00.000Z',
            }],
            proposalRows: [{
                id: 'proposal-42',
                job_id: 'job-42',
            }],
            jobRows: [{
                id: 'job-42',
                title: 'Landing Page Refresh',
            }],
        });

        await waitFor(() => {
            expect(supabaseState.requestedProposalIds).toEqual(expect.arrayContaining([['proposal-42']]));
            expect(supabaseState.requestedJobIds).toEqual(expect.arrayContaining([['job-42']]));
        });

        await waitFor(() => {
            expect(screen.queryByText(/Unknown Project/i)).not.toBeInTheDocument();
        });

        expect(screen.getAllByText(/Landing Page Refresh/i).length).toBeGreaterThan(0);
    });

    it('falls back to the legacy contract select when total_amount is missing from the schema', async () => {
        const conversation = createConversation({
            id: 'conv-legacy-contract-schema',
            name: 'ija lenna',
            contractId: 'contract-legacy-schema',
            otherUserId: 'freelancer-4',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-legacy-contract-schema',
                conversationId: conversation.id,
                content: 'Legacy schema contract thread message',
                senderId: 'freelancer-4',
                receiverId: 'user-1',
                contractId: 'contract-legacy-schema',
            }),
        ];

        supabaseState.contractMissingTotalAmountError = true;

        await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [{
                id: 'contract-legacy-schema',
                status: 'active',
                title: 'Legacy Schema Contract',
                amount: 1200,
            }],
        });

        await waitFor(() => {
            expect(screen.queryByText(/Unknown Project/i)).not.toBeInTheDocument();
        });

        expect(screen.getAllByText(/Legacy Schema Contract/i).length).toBeGreaterThan(0);
        expect(
            supabaseState.contractSelectColumns.some((columns) => columns.includes('total_amount'))
        ).toBe(true);
        expect(
            supabaseState.contractSelectColumns.some((columns) => !columns.includes('total_amount'))
        ).toBe(true);
    });

    it('falls back to the partner proposal title when a contract conversation id cannot resolve directly', async () => {
        const conversation = createConversation({
            id: 'conv-orphan-contract',
            name: 'ija lenna',
            contractId: 'orphan-contract-id',
            otherUserId: 'freelancer-3',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-orphan-contract',
                conversationId: conversation.id,
                content: 'No messages yet',
                senderId: 'freelancer-3',
                receiverId: 'user-1',
                contractId: 'orphan-contract-id',
            }),
        ];

        await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [],
            proposalRows: [{
                id: 'proposal-88',
                job_id: 'job-88',
                freelancer_id: 'freelancer-3',
                status: 'accepted',
                created_at: '2026-04-16T10:00:00.000Z',
            }],
            jobRows: [{
                id: 'job-88',
                title: 'Archive Smoke and Test Job',
                client_id: 'user-1',
            }],
        });

        await waitFor(() => {
            expect(supabaseState.requestedProposalIds).toEqual(expect.arrayContaining([['freelancer-3']]));
            expect(supabaseState.requestedJobIds).toEqual(expect.arrayContaining([['job-88']]));
        });

        await waitFor(() => {
            expect(screen.queryByText(/Unknown Project/i)).not.toBeInTheDocument();
        });

        expect(screen.getAllByText(/Archive Smoke and Test Job/i).length).toBeGreaterThan(0);
    });

    it('falls back to a contract reference when no contract title can be resolved', async () => {
        const conversation = createConversation({
            id: 'conv-name-fallback',
            name: 'ija lenna',
            contractId: 'contract-name-fallback',
            otherUserId: 'freelancer-5',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-name-fallback',
                conversationId: conversation.id,
                content: 'Name fallback contract thread message',
                senderId: 'freelancer-5',
                receiverId: 'user-1',
                contractId: 'contract-name-fallback',
            }),
        ];

        await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [],
            proposalRows: [],
            jobRows: [],
        });

        await waitFor(() => {
            expect(screen.queryByText(/Unknown Project/i)).not.toBeInTheDocument();
        });

        expect(screen.getAllByText(/Contract #contract/i).length).toBeGreaterThan(0);

        // Click the Workspace toggle button to open the workspace sidebar
        fireEvent.click(screen.getByRole('button', { name: /Workspace/i }));
    });

    it('opens the client profile from a freelancer-side contract conversation', async () => {
        authMocks.state.activeMode = 'freelancer';

        const conversation = createConversation({
            id: 'conv-client-profile-route',
            name: 'wacim abdelli',
            contractId: 'contract-client-profile-route',
            otherUserId: 'client-1',
            participant1: 'client-1',
            participant2: 'user-1',
            inboxParticipant1: 'client',
            inboxParticipant2: 'freelancer',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-client-profile-route',
                conversationId: conversation.id,
                content: 'Profile route contract thread message',
                senderId: 'client-1',
                receiverId: 'user-1',
                contractId: 'contract-client-profile-route',
            }),
        ];

        await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [{
                id: 'contract-client-profile-route',
                status: 'active',
                client_id: 'client-1',
                freelancer_id: 'user-1',
            }],
        });

        routeMocks.navigate.mockClear();

        fireEvent.click(screen.getAllByRole('button', { name: 'View profile' })[0]);

        expect(routeMocks.navigate).toHaveBeenCalledWith('/client/client-1');
    });

    it.each([
        {
            label: 'pending payment',
            contractRows: [{ id: 'contract-pending-payment', status: 'pending_payment' }],
            banner: 'Payment pending.',
            classToken: 'border-white/[0.06]',
        },
    ])('shows a $label banner and keeps the contract thread writable', async ({
        label,
        contractRows,
        banner,
        classToken,
    }) => {
        const contractId = `contract-${label.replace(/\s+/g, '-')}`;
        const conversation = createConversation({
            id: `conv-${label.replace(/\s+/g, '-')}`,
            name: `${label} user`,
            contractId,
        });
        const threadMessages = [
            createMessage({
                id: `msg-${label.replace(/\s+/g, '-')}`,
                conversationId: conversation.id,
                content: `${label} contract thread message`,
                contractId,
            }),
        ];

        await renderSelectedScenario({ conversation, threadMessages, contractRows });

        await waitFor(() => {
            expect(supabaseState.requestedContractIds).toEqual(expect.arrayContaining([[contractId]]));
        });

        const bannerText = await screen.findByText(banner, {}, { timeout: 3000 });
        const bannerContainer = bannerText.closest('.rounded-xl');

        expect(bannerContainer).not.toBeNull();
        expect(screen.getByPlaceholderText('Type a message...')).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Attach file' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Start recording' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Reply to message' })).toBeInTheDocument();
    });

    it('delays the unknown-status banner before showing it', async () => {
        const contractId = 'contract-unknown';
        const conversation = createConversation({
            id: 'conv-unknown',
            name: 'unknown user',
            contractId,
        });
        const threadMessages = [
            createMessage({
                id: 'msg-unknown',
                conversationId: conversation.id,
                content: 'unknown contract thread message',
                contractId,
            }),
        ];

        await renderSelectedScenario({ conversation, threadMessages, contractRows: [] });

        await waitFor(() => {
            expect(supabaseState.requestedContractIds).toEqual(expect.arrayContaining([[contractId]]));
        });

        expect(screen.queryByText('Contract status unavailable.')).not.toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Contract status unavailable.')).toBeInTheDocument();
        }, { timeout: 2500 });

        expect(screen.getByPlaceholderText('Type a message...')).toBeEnabled();
    });

    it.each([
        {
            label: 'completed',
            contractId: 'contract-completed',
            banner: 'Contract completed. Thread is read-only.',
            classToken: 'border-white/[0.06]',
        },
        {
            label: 'cancelled',
            contractId: 'contract-cancelled',
            banner: 'Contract cancelled. Thread is read-only.',
            classToken: 'border-white/[0.06]',
        },
        {
            label: 'disputed',
            contractId: 'contract-disputed',
            banner: 'Contract under dispute. Chat locked.',
            classToken: 'border-white/[0.06]',
        },
    ])('locks $label contract threads to read-only and blocks file attachment writes', async ({
        label,
        contractId,
        banner,
        classToken,
    }) => {
        const conversation = createConversation({
            id: `conv-${label}`,
            name: `${label} user`,
            contractId,
        });
        const threadMessages = [
            createMessage({
                id: `msg-${label}`,
                conversationId: conversation.id,
                content: `${label} contract thread message`,
                contractId,
            }),
        ];

        const { container } = await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [{ id: contractId, status: label }],
        });

        const bannerText = (await screen.findAllByText(banner))[0];
        const bannerContainer = bannerText.closest('.rounded-xl');

        expect(bannerContainer).not.toBeNull();
        expect(screen.queryByPlaceholderText('Type a message...')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Attach file' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Start recording' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Reply to message' })).not.toBeInTheDocument();
    });

    it('cancels an in-progress voice draft when lifecycle status turns the thread read-only', async () => {
        audioRecorderMocks.state.audioBlob = new Blob(['voice'], { type: 'audio/webm' });
        audioRecorderMocks.state.recordingTime = 12;

        const conversation = createConversation({
            id: 'conv-completed-audio',
            name: 'Completed Audio User',
            contractId: 'contract-completed-audio',
        });
        const threadMessages = [
            createMessage({
                id: 'msg-completed-audio',
                conversationId: conversation.id,
                content: 'Completed audio thread message',
                contractId: 'contract-completed-audio',
            }),
        ];

        await renderSelectedScenario({
            conversation,
            threadMessages,
            contractRows: [{ id: 'contract-completed-audio', status: 'completed' }],
        });

        await screen.findAllByText('Contract completed. Thread is read-only.');

        expect(audioRecorderMocks.cancelRecording).toHaveBeenCalledTimes(1);
    });
});
