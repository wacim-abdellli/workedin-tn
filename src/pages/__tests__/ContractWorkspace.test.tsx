import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react', () => ({
    ArrowLeft: () => <svg data-testid="lucide-arrow-left" />,
    AlertCircle: () => <svg data-testid="lucide-alert-circle" />,
    PackageCheck: () => <svg data-testid="lucide-package-check" />,
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        language: 'ar',
        dir: 'rtl',
        setLanguage: vi.fn(),
        t: (key: string) => key,
        tx: (key: string, _params?: Record<string, string>, fallback?: string) => fallback || key,
    }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

const toastMocks = vi.hoisted(() => ({
    showToast: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'client-1' },
        profile: { full_name: 'Client Name', avatar_url: null },
    }),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: toastMocks.showToast }),
}));

const contractStateMocks = vi.hoisted(() => ({
    deliverWork: vi.fn().mockResolvedValue(undefined),
    acceptWork: vi.fn().mockResolvedValue(undefined),
    requestChanges: vi.fn().mockResolvedValue(undefined),
    openDispute: vi.fn().mockResolvedValue(undefined),
    cancelContract: vi.fn().mockResolvedValue(undefined),
    holdClearancePayment: vi.fn().mockResolvedValue(undefined),
    deliverMilestoneWork: vi.fn().mockResolvedValue(undefined),
    acceptMilestoneWork: vi.fn().mockResolvedValue(undefined),
    holdMilestoneClearance: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/useContractState', () => ({
    useContractState: () => ({
        ...contractStateMocks,
        isDelivering: false,
        isAccepting: false,
        isDisputing: false,
        isCancelling: false,
    }),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })),
        })),
        storage: {
            from: vi.fn(() => ({
                createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://files.example/preview.pdf' }, error: null }),
            })),
        },
        rpc: vi.fn().mockResolvedValue({ error: null, data: null }),
    },
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
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

vi.mock('@/components/contracts/SubmitDeliveryForm', () => ({
    default: () => <div data-testid="submit-delivery-form" />,
}));

const wsMocks = vi.hoisted(() => ({
    loadWorkspace: vi.fn().mockResolvedValue(undefined),
    setDeliverOpen: vi.fn(),
    setChangesOpen: vi.fn(),
    setDisputeOpen: vi.fn(),
    setCancelOpen: vi.fn(),
    setConfirmReleaseOpen: vi.fn(),
    setFundEscrowOpen: vi.fn(),
    setHoldClearanceOpen: vi.fn(),
    setHoldClearanceReason: vi.fn(),
    setDeliverNote: vi.fn(),
    setReviewFiles: vi.fn(),
    setUploadedAssets: vi.fn(),
    setUploadProgress: vi.fn(),
    setSelectedMilestoneId: vi.fn(),
    setUploadingFileName: vi.fn(),
    setIsUploading: vi.fn(),
    setIsUploadPaused: vi.fn(),
    setIsHoldingClearance: vi.fn(),
    handlePauseUpload: vi.fn(),
    handleResumeUpload: vi.fn(),
}));

function makeWsMock(overrides: Record<string, unknown> = {}) {
    return {
        contract: { id: 'contract-1', status: 'active', client_id: 'client-1' },
        setContract: vi.fn(),
        jobTitle: 'Build contract workspace',
        jobDeadline: '2026-04-01T00:00:00.000Z',
        jobCategory: null,
        latestDelivery: null,
        lastRevisionNote: null,
        sharedFiles: [],
        hasReviewed: false,
        counterpartyProfile: { full_name: 'Freelancer Name', avatar_url: null },
        isLoading: false,
        error: null,
        setError: vi.fn(),
        loadWorkspace: wsMocks.loadWorkspace,
        deliverNote: '',
        reviewFiles: [],
        selectedMilestoneId: '',
        savedLinks: [],
        savedFileStages: {},
        isUploadPaused: false,
        uploadingFileName: null,
        uploadedAssetsRef: { current: [] },
        uploadedAssets: [],
        isUploadPausedRef: { current: false },
        tusProgress: 0,
        isTusUploading: false,
        isUploading: false,
        uploadProgress: { currentBytes: 0, totalBytes: 0 },
        uploadTusFile: vi.fn(),
        ...wsMocks,
        ...overrides,
    };
}

vi.mock('../contractWorkspace', () => ({
    WorkspaceSkeleton: () => <div data-testid="skeleton" className="shimmer" />,
    useWorkspaceData: vi.fn(),
    WorkspaceModals: () => <div data-testid="workspace-modals" />,
}));

vi.mock('../contractWorkspace/useWorkspaceActions', () => ({
    handleDeliver: vi.fn((opts) => {
        if (opts?.setDeliverNote) opts.setDeliverNote('');
        if (opts?.setDeliverOpen) opts.setDeliverOpen(true);
    }),
    addDeliveryFiles: vi.fn(),
    handleSubmitDelivery: vi.fn(),
    handleConfirmRelease: vi.fn(),
    handleSubmitChanges: vi.fn(),
    handleSubmitDispute: vi.fn(),
    handleSubmitHoldClearance: vi.fn(),
    handleSubmitCancel: vi.fn(),
}));

import ContractWorkspacePage from '@/pages/ContractWorkspacePage';
import * as wsModule from '../contractWorkspace';

function renderWorkspace() {
    return render(
        <HelmetProvider>
            <MemoryRouter initialEntries={['/contracts/contract-1']}>
                <Routes>
                    <Route path="/contracts/:contractId" element={<ContractWorkspacePage />} />
                </Routes>
            </MemoryRouter>
        </HelmetProvider>
    );
}

describe('ContractWorkspacePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const useWorkspaceData = wsModule.useWorkspaceData as ReturnType<typeof vi.fn>;
        useWorkspaceData.mockReturnValue(makeWsMock());
    });

    it('renders loading skeleton when workspace is loading', () => {
        const useWorkspaceData = wsModule.useWorkspaceData as ReturnType<typeof vi.fn>;
        useWorkspaceData.mockReturnValue(makeWsMock({ isLoading: true }));
        renderWorkspace();
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('renders error state when workspace fails to load', () => {
        const useWorkspaceData = wsModule.useWorkspaceData as ReturnType<typeof vi.fn>;
        useWorkspaceData.mockReturnValue(makeWsMock({ error: 'Failed to load' }));
        renderWorkspace();
        expect(screen.getByText(/Unable to load workspace/)).toBeInTheDocument();
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('renders the contract sidebar when data is loaded', () => {
        renderWorkspace();
        expect(screen.getByText('Header')).toBeInTheDocument();
        expect(screen.getByText('Open deliver')).toBeInTheDocument();
        expect(screen.getByText('Request changes')).toBeInTheDocument();
        expect(screen.getByText('Open payment')).toBeInTheDocument();
        expect(screen.getByText('Open dispute')).toBeInTheDocument();
        expect(screen.getByText('Open review')).toBeInTheDocument();
    });

    it('opens delivery modal when deliver is clicked', () => {
        renderWorkspace();
        fireEvent.click(screen.getByRole('button', { name: 'Open deliver' }));
        expect(wsMocks.setDeliverNote).toHaveBeenCalled();
    });

    it('renders workspace modals', () => {
        renderWorkspace();
        expect(screen.getByTestId('workspace-modals')).toBeInTheDocument();
    });

    it('calls loadWorkspace when retry button is clicked in error state', () => {
        const useWorkspaceData = wsModule.useWorkspaceData as ReturnType<typeof vi.fn>;
        useWorkspaceData.mockReturnValue(makeWsMock({ error: 'Failed' }));
        renderWorkspace();
        fireEvent.click(screen.getByText('Retry'));
        expect(wsMocks.loadWorkspace).toHaveBeenCalled();
    });
});
