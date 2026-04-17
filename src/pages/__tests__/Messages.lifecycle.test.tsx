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
    contractRows: [] as Array<{ id: string; status: string | null }>,
    contractError: null as { message: string } | null,
    fromCalls: [] as string[],
    requestedContractIds: [] as string[][],
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
        profile: { active_mode: 'client' },
        activeMode: 'client',
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

            if (table !== 'contracts') {
                throw new Error(`Unexpected supabase table access in Messages lifecycle test: ${table}`);
            }

            const builder = {
                select: vi.fn(() => builder),
                in: vi.fn(async (_column: string, ids: string[]) => {
                    supabaseState.requestedContractIds.push([...ids]);

                    if (supabaseState.contractError) {
                        return { data: null, error: supabaseState.contractError };
                    }

                    return {
                        data: supabaseState.contractRows.filter((row) => ids.includes(row.id)),
                        error: null,
                    };
                }),
            };

            return builder;
        }),
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
}: {
    id: string;
    name: string;
    contractId?: string | null;
    otherUserId?: string;
}) {
    return {
        id,
        participant_1: 'user-1',
        participant_2: otherUserId,
        contract_id: contractId,
        last_message_text: `Preview for ${name}`,
        last_message_at: '2026-04-15T10:00:00.000Z',
        unread_count_1: 0,
        unread_count_2: 0,
        unread_count: 0,
        created_at: '2026-04-14T10:00:00.000Z',
        updated_at: '2026-04-15T10:00:00.000Z',
        conversation_scope: contractId ? 'contract' : 'shared',
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
}: {
    conversation: ReturnType<typeof createConversation>;
    threadMessages: Array<ReturnType<typeof createMessage>>;
    contractRows?: Array<{ id: string; status: string | null }>;
}) {
    supabaseState.contractRows = contractRows;

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
}: {
    conversation: ReturnType<typeof createConversation>;
    threadMessages: Array<ReturnType<typeof createMessage>>;
    contractRows?: Array<{ id: string; status: string | null }>;
}) {
    setScenario({ conversation, threadMessages, contractRows });
    const view = renderMessages(`/messages?conversation=${conversation.id}`);

    await waitFor(() => {
        expect(messageServiceMocks.getMessages).toHaveBeenCalledWith(conversation.id);
    });

    await screen.findByRole('button', { name: 'Send message' });

    return view;
}

describe('Messages lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

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
        supabaseState.contractError = null;
        supabaseState.fromCalls = [];
        supabaseState.requestedContractIds = [];
        supabaseState.channelNames = [];

        audioRecorderMocks.state.isRecording = false;
        audioRecorderMocks.state.recordingTime = 0;
        audioRecorderMocks.state.audioBlob = null;
        audioRecorderMocks.state.error = null;

        audioRecorderMocks.startRecording.mockResolvedValue(undefined);
        audioRecorderMocks.stopRecording.mockImplementation(() => undefined);
        audioRecorderMocks.cancelRecording.mockImplementation(() => undefined);

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

        expect(screen.queryByRole('button', { name: 'Open Contract' })).not.toBeInTheDocument();
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

        expect(screen.getByRole('button', { name: 'Open Contract' })).toBeInTheDocument();
        expect(screen.queryByText('Payment is still being confirmed for this contract. Messaging remains open.')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Attach file' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Start recording' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
        expect(audioRecorderMocks.startRecording).toHaveBeenCalledTimes(1);
    });

    it.each([
        {
            label: 'pending payment',
            contractRows: [{ id: 'contract-pending-payment', status: 'pending_payment' }],
            banner: 'Payment is still being confirmed for this contract. Messaging remains open.',
            classToken: 'border-blue-500/40',
        },
        {
            label: 'disputed',
            contractRows: [{ id: 'contract-disputed', status: 'disputed' }],
            banner: 'This contract is under dispute. Keep all messages focused on resolution details.',
            classToken: 'border-amber-500/40',
        },
        {
            label: 'unknown',
            contractRows: [],
            banner: 'Contract status is currently unavailable. Messaging remains open.',
            classToken: 'border-blue-500/40',
        },
    ])('shows a $label banner but keeps the contract thread writable', async ({
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
        const bannerContainer = bannerText.closest('div');

        expect(bannerContainer).not.toBeNull();
        expect(bannerContainer).toHaveClass(classToken);
        expect(screen.getByPlaceholderText('Type a message...')).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Attach file' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Start recording' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Reply to message' })).toBeInTheDocument();
    });

    it.each([
        {
            label: 'completed',
            contractId: 'contract-completed',
            banner: 'This contract is completed. The thread is now read-only.',
            classToken: 'border-emerald-500/40',
        },
        {
            label: 'cancelled',
            contractId: 'contract-cancelled',
            banner: 'This contract was cancelled. The thread is now read-only.',
            classToken: 'border-red-500/40',
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

        const bannerText = await screen.findByText(banner);
        const bannerContainer = bannerText.closest('div');

        expect(bannerContainer).not.toBeNull();
        expect(bannerContainer).toHaveClass(classToken);
        expect(screen.getByPlaceholderText(banner)).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Attach file' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Start recording' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Reply to message' })).not.toBeInTheDocument();

        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).not.toBeNull();

        fireEvent.change(fileInput as HTMLInputElement, {
            target: {
                files: [new File(['blocked'], 'blocked.pdf', { type: 'application/pdf' })],
            },
        });

        expect(toastMocks.showToast).toHaveBeenCalledWith(banner, 'warning');
        expect(messageServiceMocks.uploadMessageAttachment).not.toHaveBeenCalled();
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

        await screen.findByText('This contract is completed. The thread is now read-only.');

        expect(audioRecorderMocks.cancelRecording).toHaveBeenCalledTimes(1);
    });
});
