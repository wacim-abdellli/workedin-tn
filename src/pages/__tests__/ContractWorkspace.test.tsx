import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
    invalidateQueries: vi.fn(),
}));

const routeMocks = vi.hoisted(() => ({
    navigate: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
    showToast: vi.fn(),
}));

const hookMocks = vi.hoisted(() => ({
    sendMessage: vi.fn().mockResolvedValue(undefined),
    setTyping: vi.fn(),
    upload: vi.fn().mockResolvedValue({ url: 'https://files.example/uploaded.pdf' }),
    refreshContractState: vi.fn(),
    deliverWork: vi.fn().mockResolvedValue(undefined),
    acceptWork: vi.fn().mockResolvedValue(undefined),
    requestChanges: vi.fn().mockResolvedValue(undefined),
    openDispute: vi.fn().mockResolvedValue(undefined),
}));

const supabaseInsert = vi.hoisted(() => vi.fn(() => {
    const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
    };
    return builder;
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: queryMocks.useQuery,
    useMutation: queryMocks.useMutation,
    useQueryClient: queryMocks.useQueryClient,
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => routeMocks.navigate,
    };
});

vi.mock('@/i18n', () => {
    const mockT = {
        common: {
            back: 'الرجوع للخلف',
            viewJob: 'عرض المهمة',
        },
        contract: {
            workspaceTitle: 'مساحة العمل',
            seoDescription: 'Track conversation, files, and payment status for your contract from the workspace.',
            status: 'Status',
            inProgress: 'In progress',
            deliverWork: 'Deliver work',
            openDispute: 'Open dispute',
        },
    };
    return {
        useTranslation: () => ({
            language: 'ar',
            dir: 'rtl',
            setLanguage: vi.fn(),
            t: mockT,
            tx: (key: string, _params?: Record<string, string>, fallback?: string) => {
                const parts = key.split('.');
                let val: any = mockT;
                for (const part of parts) {
                    val = val?.[part];
                }
                return typeof val === 'string' ? val : (fallback ?? key);
            },
        }),
    };
});

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'client-1' },
    }),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: toastMocks.showToast }),
}));

vi.mock('@/hooks/useRealtimeChat', () => ({
    useRealtimeChat: () => ({
        messages: [{ id: 'm1', content: 'Hello' }],
        isLoading: false,
        sendMessage: hookMocks.sendMessage,
        isSending: false,
        setTyping: hookMocks.setTyping,
        otherUserTyping: true,
    }),
}));

vi.mock('@/hooks/useFileUpload', () => ({
    useFileUpload: () => ({
        upload: hookMocks.upload,
        isUploading: false,
        progress: 25,
    }),
}));

vi.mock('@/hooks/useContractState', () => ({
    useContractState: () => ({
        contract: { status: 'active' },
        deliverWork: hookMocks.deliverWork,
        acceptWork: hookMocks.acceptWork,
        requestChanges: hookMocks.requestChanges,
        openDispute: hookMocks.openDispute,
        isDelivering: false,
        isAccepting: false,
        isDisputing: false,
        refresh: hookMocks.refreshContractState,
    }),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: supabaseInsert,
        rpc: vi.fn().mockResolvedValue({ error: null, data: null }),
    },
}));

vi.mock('@/services/contracts', () => ({
    getContractById: vi.fn(),
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) => (
        isOpen ? <div><h2>{title}</h2>{children}</div> : null
    ),
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
}));

vi.mock('@/components/ui/Reviews', () => ({
    ReviewForm: ({ onSubmit, onCancel }: { onSubmit: (rating: number, comment: string) => void; onCancel: () => void }) => (
        <div>
            <button onClick={() => onSubmit(5, 'Great work')}>Submit review</button>
            <button onClick={onCancel}>Cancel review</button>
        </div>
    ),
}));

vi.mock('@/components/ui/PaymentModal', () => ({
    default: ({ isOpen, onSuccess }: { isOpen: boolean; onSuccess: () => void }) => (
        isOpen ? <button onClick={onSuccess}>Confirm payment</button> : null
    ),
}));

vi.mock('@/components/contracts/ChatSection', () => ({
    default: ({ onSendMessage, onFileUpload, onTyping }: {
        onSendMessage: (content: string) => void;
        onFileUpload: (file: File) => void;
        onTyping: () => void;
    }) => (
        <div>
            <button onClick={() => onSendMessage('Hello from test')}>Send chat</button>
            <button onClick={() => onFileUpload(new File(['x'], 'brief.pdf', { type: 'application/pdf' }))}>Upload file</button>
            <button onClick={onTyping}>Typing</button>
        </div>
    ),
}));

vi.mock('@/components/contracts/ContractDetailsSidebar', () => ({
    default: ({
        onDeliver,
        onRequestChanges,
        onAcceptAndPay,
        onDispute,
        onReview,
    }: {
        onDeliver: () => void;
        onRequestChanges: () => void;
        onAcceptAndPay: () => void;
        onDispute: () => void;
        onReview: () => void;
    }) => (
        <div>
            <button onClick={onDeliver}>Open deliver</button>
            <button onClick={onRequestChanges}>Request changes</button>
            <button onClick={onAcceptAndPay}>Open payment</button>
            <button onClick={onDispute}>Open dispute</button>
            <button onClick={onReview}>Open review</button>
        </div>
    ),
}));

import ContractWorkspace from '@/pages/ContractWorkspace';

function renderWorkspace() {
    return render(
        <HelmetProvider>
            <MemoryRouter initialEntries={['/contracts/contract-1']}>
                <Routes>
                    <Route path="/contracts/:contractId" element={<ContractWorkspace />} />
                </Routes>
            </MemoryRouter>
        </HelmetProvider>
    );
}

describe('ContractWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryMocks.useQueryClient.mockReturnValue({
            invalidateQueries: queryMocks.invalidateQueries,
        });
        queryMocks.useMutation.mockImplementation(({
            mutationFn,
            onSuccess,
            onError,
        }: {
            mutationFn?: (value?: unknown) => Promise<unknown> | unknown;
            onSuccess?: () => void;
            onError?: () => void;
        }) => ({
            mutate: vi.fn(async (value?: unknown) => {
                try {
                    await mutationFn?.(value);
                    onSuccess?.();
                } catch {
                    onError?.();
                }
            }),
            isPending: false,
        }));
        queryMocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'contract') {
                return {
                    data: {
                        id: 'contract-1',
                        status: 'active',
                        payment_status: 'pending',
                        amount: 500,
                        started_at: '2026-03-01T00:00:00.000Z',
                        job: {
                            id: 'job-1',
                            title: 'Build contract workspace',
                            description: 'Polish launch details',
                            budget: 500,
                            deadline: '2026-04-01T00:00:00.000Z',
                        },
                        freelancer: {
                            id: 'freelancer-1',
                            full_name: 'Freelancer Name',
                            avatar_url: null,
                        },
                        client: {
                            id: 'client-1',
                            full_name: 'Client Name',
                            avatar_url: null,
                        },
                    },
                    isLoading: false,
                };
            }

            return { data: false, isLoading: false };
        });
    });

    it('renders loading and non-blank empty states from the initial contract query', () => {
        queryMocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'contract') {
                return { data: undefined, isLoading: true };
            }

            return { data: false, isLoading: false };
        });

        const loadingView = renderWorkspace();

        // The loading state shows skeleton UI with shimmer effect, not a spinner
        expect(loadingView.container.querySelector('.shimmer')).toBeInTheDocument();

        queryMocks.useQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
            if (queryKey[0] === 'contract') {
                return { data: null, isLoading: false };
            }

            return { data: false, isLoading: false };
        });

        const emptyView = renderWorkspace();

        expect(emptyView.getByText('Contract not found')).toBeInTheDocument();
        expect(emptyView.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('exposes mobile tab semantics and labeled modal fields for accessibility', async () => {
        renderWorkspace();

        expect(screen.getByRole('button', { name: 'الرجوع للخلف' })).toBeInTheDocument();

        const tablist = screen.getByRole('tablist', { name: 'Workspace tabs' });
        expect(tablist).toBeInTheDocument();

        const chatTab = screen.getByRole('tab', { name: 'Show chat' });
        const detailsTab = screen.getByRole('tab', { name: 'Show details' });
        const filesTab = screen.getByRole('tab', { name: 'Show files' });

        expect(chatTab).toHaveAttribute('aria-selected', 'true');
        expect(chatTab).toHaveAttribute('aria-controls', 'workspace-panel-chat');
        expect(detailsTab).toHaveAttribute('aria-controls', 'workspace-panel-details');
        expect(filesTab).toHaveAttribute('aria-controls', 'workspace-panel-files');

        fireEvent.click(detailsTab);
        expect(detailsTab).toHaveAttribute('aria-selected', 'true');

        fireEvent.click(screen.getByRole('button', { name: 'Open deliver' }));
        expect(screen.getByLabelText('Delivery notes')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Open dispute' }));
        expect(screen.getByLabelText('Dispute reason')).toBeInTheDocument();
    });

    it('renders the workspace and wires the major contract actions', async () => {
        renderWorkspace();

        expect(screen.getByText('Build contract workspace')).toBeInTheDocument();
        expect(hookMocks.refreshContractState).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Send chat' }));
        await waitFor(() => {
            expect(hookMocks.sendMessage).toHaveBeenCalledWith('Hello from test', 'freelancer-1');
        });

        fireEvent.click(screen.getByRole('button', { name: 'Upload file' }));
        await waitFor(() => {
            expect(hookMocks.upload).toHaveBeenCalled();
            expect(hookMocks.sendMessage).toHaveBeenCalledWith(
                '📎 brief.pdf',
                'freelancer-1',
                [expect.objectContaining({ name: 'brief.pdf' })]
            );
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open deliver' }));
        fireEvent.change(screen.getByPlaceholderText(/Delivery notes/), { target: { value: 'Ready for review' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Delivery' }));
        await waitFor(() => {
            expect(hookMocks.deliverWork).toHaveBeenCalledWith('Ready for review');
        });

        fireEvent.click(screen.getByRole('button', { name: 'Request changes' }));
        await waitFor(() => {
            expect(hookMocks.requestChanges).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open payment' }));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm payment' }));
        await waitFor(() => {
            expect(hookMocks.acceptWork).toHaveBeenCalled();
            expect(routeMocks.navigate).toHaveBeenCalledWith('/client/dashboard');
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open dispute' }));
        fireEvent.change(screen.getByPlaceholderText(/Explain reason for dispute/), { target: { value: 'Need help' } });
        fireEvent.click(screen.getByRole('button', { name: 'Open Dispute' }));
        await waitFor(() => {
            expect(hookMocks.openDispute).toHaveBeenCalledWith('Need help');
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open review' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
        await waitFor(() => {
            expect(screen.getByText('Header')).toBeInTheDocument();
        });
    });

    it('shows toast errors when contract actions fail', async () => {
        hookMocks.sendMessage.mockRejectedValueOnce(new Error('Message failed'));
        hookMocks.upload.mockRejectedValueOnce(new Error('Upload failed'));
        hookMocks.deliverWork.mockRejectedValueOnce(new Error('Deliver failed'));
        hookMocks.requestChanges.mockRejectedValueOnce(new Error('Changes failed'));
        hookMocks.acceptWork.mockRejectedValueOnce(new Error('Accept failed'));
        hookMocks.openDispute.mockRejectedValueOnce(new Error('Dispute failed'));
        queryMocks.useMutation.mockImplementation(({ onError }: { onError?: () => void }) => ({
            mutate: vi.fn(() => onError?.()),
            isPending: false,
        }));

        renderWorkspace();

        fireEvent.click(screen.getByRole('button', { name: 'Send chat' }));
        fireEvent.click(screen.getByRole('button', { name: 'Upload file' }));

        fireEvent.click(screen.getByRole('button', { name: 'Open deliver' }));
        fireEvent.click(screen.getByRole('button', { name: /Confirm Delivery/ }));

        fireEvent.click(screen.getByRole('button', { name: 'Request changes' }));

        fireEvent.click(screen.getByRole('button', { name: 'Open payment' }));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm payment' }));

        fireEvent.click(screen.getByRole('button', { name: 'Open dispute' }));
        fireEvent.change(screen.getByPlaceholderText(/Explain reason for dispute/), { target: { value: 'Still broken' } });
        fireEvent.click(screen.getByRole('button', { name: /Open Dispute/ }));

        fireEvent.click(screen.getByRole('button', { name: 'Open review' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));

        await waitFor(() => {
            expect(toastMocks.showToast).toHaveBeenCalled();
        });

        expect(toastMocks.showToast).toHaveBeenCalledWith('Message failed', 'error');
        expect(toastMocks.showToast).toHaveBeenCalledWith('Upload failed', 'error');
    });

    it('handles typing and review cancellation paths', async () => {
        renderWorkspace();

        fireEvent.click(screen.getByRole('button', { name: 'Typing' }));
        expect(hookMocks.setTyping).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByRole('button', { name: 'Open review' }));
        expect(screen.getByRole('button', { name: 'Cancel review' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel review' }));
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: 'Cancel review' })).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open review' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));

        await waitFor(() => {
            expect(queryMocks.invalidateQueries).toHaveBeenCalledWith({
                queryKey: ['review', 'contract-1', 'client-1'],
            });
        });
    });
});
