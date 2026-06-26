import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { supabase } from '@/lib/supabase';
import { DeliveryFileCard, SharedFileCard, FilesTab, FilesEmptyState, ImagePreview, EscrowVaultVisualizer, DeliveryFileHeroCard, DeliveryLinkHeroCard } from '../FileCardsSection';

vi.mock('lucide-react', () => ({
    Eye: () => <svg data-testid="lucide-eye" />,
    Lock: () => <svg data-testid="lucide-lock" />,
    CheckCircle: () => <svg data-testid="lucide-check-circle" />,
    FolderOpen: () => <svg data-testid="lucide-folder" />,
    LayoutGrid: () => <svg data-testid="lucide-grid" />,
    List: () => <svg data-testid="lucide-list" />,
    ChevronRight: () => <svg data-testid="lucide-chevron" />,
    Github: () => <svg data-testid="lucide-github" />,
    Video: () => <svg data-testid="lucide-video" />,
    Globe: () => <svg data-testid="lucide-globe" />,
    ExternalLink: () => <svg data-testid="lucide-external" />,
    FileSpreadsheet: () => <svg data-testid="lucide-sheet" />,
    Link: () => <svg data-testid="lucide-link" />,
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        tx: (key: string, _opts?: unknown, fallback?: string) => fallback || key,
    }),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                createSignedUrl: vi.fn<(path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: Error | null }>>(),
            })),
        },
    },
}));

vi.mock('../sidebarPrimitives', () => ({
    FileIcon: () => <span data-testid="file-icon" />,
}));

vi.mock('../contractUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../contractUtils')>();
    return {
        ...actual,
        fmtSize: (size: number | null | undefined) => {
            if (size == null || size <= 0) return null;
            return `${size} bytes`;
        },
        getLoomEmbedUrl: (url: string) => {
            if (url.includes('loom.com/share/')) {
                const id = url.split('loom.com/share/')[1]?.split('?')[0];
                return id ? `https://www.loom.com/embed/${id}` : null;
            }
            return null;
        },
        fmtDate: (date: string | null | undefined, fallback?: string) => {
            if (!date) return fallback || '';
            return new Date(date).toLocaleDateString();
        },
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

const deliveryFile = {
    id: 'f1',
    name: 'report.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 204800,
    storageBucket: 'contract-files',
    storagePath: 'uploads/report.pdf',
    assetKind: 'delivery_asset' as const,
    accessState: 'unlocked' as const,
};

const sharedFile = {
    id: 'sf1',
    name: 'reference.png',
    type: 'image/png',
    size: 102400,
    url: '',
    storageBucket: 'contract-files',
    storagePath: 'shared/reference.png',
    senderName: 'Alice',
    uploadedAt: '2025-06-01T10:00:00Z',
};

const linkFile = {
    id: 'l1',
    label: 'GitHub Repo',
    url: 'https://github.com/example/repo',
    category: 'github',
    link_kind: 'review_link' as const,
};

const baseModel = {
    st: 'active',
    reviewFiles: [deliveryFile],
    finalFiles: [],
    sharedFiles: [sharedFile],
    reviewLinks: [linkFile],
    finalLinks: [],
    showFreelancerDeliver: true,
};

describe('DeliveryFileCard', () => {
    it('renders file name and size', () => {
        render(<DeliveryFileCard file={deliveryFile as any} onPreviewFile={() => {}} />);
        expect(screen.getByText('report.pdf')).toBeInTheDocument();
        expect(screen.getByText('204800 bytes')).toBeInTheDocument();
    });

    it('renders delivery badge', () => {
        render(<DeliveryFileCard file={{ ...deliveryFile, assetKind: 'final_asset' } as any} onPreviewFile={() => {}} />);
        expect(screen.getByText(/finalSource/)).toBeInTheDocument();
    });
});

describe('SharedFileCard', () => {
    it('renders file name and sender', () => {
        render(<SharedFileCard file={sharedFile as any} onPreviewFile={() => {}} />);
        expect(screen.getByText('reference.png')).toBeInTheDocument();
        expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });

    it('renders shared badge', () => {
        render(<SharedFileCard file={sharedFile as any} onPreviewFile={() => {}} />);
        expect(screen.getByText(/shared/)).toBeInTheDocument();
    });
});

describe('FilesEmptyState', () => {
    it('renders empty message', () => {
        render(<FilesEmptyState userRole="freelancer" canDeliver={true} onDeliver={() => {}} />);
        expect(screen.getByText(/noFilesShared/)).toBeInTheDocument();
    });

    it('shows deliver button for freelancer with canDeliver', () => {
        render(<FilesEmptyState userRole="freelancer" canDeliver={true} onDeliver={() => {}} />);
        expect(screen.getByText(/submitDeliverable/)).toBeInTheDocument();
    });

    it('hides deliver button for client', () => {
        render(<FilesEmptyState userRole="client" canDeliver={false} onDeliver={() => {}} />);
        expect(screen.queryByText(/submitDeliverable/)).not.toBeInTheDocument();
    });
});

describe('EscrowVaultVisualizer', () => {
    it('shows secured state when locked', () => {
        render(<EscrowVaultVisualizer isLocked={true} />);
        expect(screen.getByText(/escrowVaultSecured/)).toBeInTheDocument();
    });

    it('shows released state when unlocked', () => {
        render(<EscrowVaultVisualizer isLocked={false} />);
        expect(screen.getByText(/escrowReleased/)).toBeInTheDocument();
    });
});

describe('DeliveryFileHeroCard', () => {
    it('renders file name and size', () => {
        render(<DeliveryFileHeroCard file={deliveryFile as any} onPreviewFile={() => {}} />);
        expect(screen.getByText('report.pdf')).toBeInTheDocument();
        expect(screen.getByText('204800 bytes')).toBeInTheDocument();
    });

    it('shows locked overlay when file is locked final asset', () => {
        render(<DeliveryFileHeroCard file={{ ...deliveryFile, assetKind: 'final_asset', accessState: 'locked' } as any} onPreviewFile={() => {}} />);
        expect(screen.getByText(/escrowLocked/)).toBeInTheDocument();
    });
});

describe('DeliveryLinkHeroCard', () => {
    it('renders link label', () => {
        render(<DeliveryLinkHeroCard link={linkFile as any} reveal={true} />);
        expect(screen.getByText('GitHub Repo')).toBeInTheDocument();
    });

    it('renders loom iframe when reveal is true and link is loom', () => {
        const loomLink = { ...linkFile, category: 'loom', url: 'https://www.loom.com/share/abc123' };
        render(<DeliveryLinkHeroCard link={loomLink as any} reveal={true} />);
        const iframe = document.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
        expect(iframe?.src).toBe('https://www.loom.com/embed/abc123');
    });
});

describe('FilesTab', () => {
    it('renders filter buttons', () => {
        render(<FilesTab model={baseModel as any} fileFilter="all" setFileFilter={() => {}} userRole="freelancer" onPreviewFile={() => {}} onDeliver={() => {}} />);
        expect(screen.getByText(/allFiles/)).toBeInTheDocument();
        expect(screen.getByText(/deliveries/)).toBeInTheDocument();
        expect(screen.getByText(/sharedFiles/)).toBeInTheDocument();
    });

    it('renders delivery files', () => {
        render(<FilesTab model={baseModel as any} fileFilter="all" setFileFilter={() => {}} userRole="freelancer" onPreviewFile={() => {}} onDeliver={() => {}} />);
        expect(screen.getAllByText('report.pdf').length).toBeGreaterThanOrEqual(1);
    });

    it('renders shared files', () => {
        render(<FilesTab model={baseModel as any} fileFilter="all" setFileFilter={() => {}} userRole="freelancer" onPreviewFile={() => {}} onDeliver={() => {}} />);
        expect(screen.getAllByText('reference.png').length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty state when no files match filter', () => {
        render(<FilesTab model={{ ...baseModel, reviewFiles: [], sharedFiles: [] } as any} fileFilter="delivery" setFileFilter={() => {}} userRole="freelancer" onPreviewFile={() => {}} onDeliver={() => {}} />);
        expect(screen.getByText(/noFilesShared/)).toBeInTheDocument();
    });
});

describe('ImagePreview', () => {
    it('shows error state when fetch fails', async () => {
        const mockCreateSignedUrl = vi.fn().mockRejectedValue(new Error('network error'));
        vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrl: mockCreateSignedUrl } as any);

        render(<ImagePreview storageBucket="contract-files" storagePath="test.jpg" />);

        await waitFor(() => {
            expect(screen.getByText(/previewUnavailable/)).toBeInTheDocument();
        });
    });

    it('renders image when fetch succeeds', async () => {
        const mockCreateSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/img.jpg' }, error: null });
        vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrl: mockCreateSignedUrl } as any);

        render(<ImagePreview storageBucket="contract-files" storagePath="test.jpg" />);

        await waitFor(() => {
            const img = document.querySelector('img');
            expect(img).toBeInTheDocument();
            expect(img?.src).toBe('https://example.com/img.jpg');
        });
    });
});
