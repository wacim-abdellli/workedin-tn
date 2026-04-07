import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
    from: vi.fn(),
}));

const captured = vi.hoisted(() => ({
    profileSelect: '',
}));

vi.mock('@/lib/supabase', () => ({
    supabase: supabaseMock,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: null }),
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        tx: (_key: string, _params?: Record<string, string>, fallback?: string) => fallback ?? _key,
    }),
}));

vi.mock('@/components/common/SEO', () => ({
    default: () => null,
    SEO_CONFIG: { dashboard: {} },
}));

vi.mock('@/components/layout', () => ({
    Header: () => <div>Header</div>,
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <button onClick={onClick}>{children}</button>
    ),
}));

vi.mock('@/components/common/OptimizedImage', () => ({
    default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@/components/common/SkeletonCard', () => ({
    Skeleton: () => <div>Loading...</div>,
}));

import ClientProfile from '@/pages/ClientProfile';

describe('ClientProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        captured.profileSelect = '';

        supabaseMock.from.mockImplementation((table: string) => {
            if (table === 'public_profiles') {
                return {
                    select: vi.fn((selection: string) => {
                        captured.profileSelect = selection;
                        return {
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'client-1',
                                        full_name: 'Safe Client',
                                        avatar_url: null,
                                        location: 'Sousse',
                                        bio: 'Public bio only',
                                        created_at: '2026-01-01T00:00:00.000Z',
                                        cin_verified: true,
                                    },
                                    error: null,
                                }),
                            }),
                        };
                    }),
                };
            }

            if (table === 'jobs') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                order: vi.fn().mockReturnValue({
                                    limit: vi.fn().mockResolvedValue({
                                        data: [
                                            {
                                                id: 'job-1',
                                                title: 'Design landing page',
                                                category: 'design',
                                                budget_min: 200,
                                                budget_max: 400,
                                                created_at: '2026-03-01T00:00:00.000Z',
                                                status: 'open',
                                                proposals_count: 3,
                                            },
                                        ],
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    }),
                };
            }

            if (table === 'contracts') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: [{ total_amount: 500, status: 'completed' }],
                            error: null,
                        }),
                    }),
                };
            }

            if (table === 'reviews') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({
                            data: [{ rating: 5 }],
                            error: null,
                        }),
                    }),
                };
            }

            throw new Error(`Unexpected table: ${table}`);
        });
    });

    it('loads public client identity from public_profiles without requesting private fields', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/client/client-1']}>
                    <Routes>
                        <Route path="/client/:clientId" element={<ClientProfile />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Safe Client' })).toBeInTheDocument();
        });

        expect(supabaseMock.from).toHaveBeenCalledWith('public_profiles');
        expect(supabaseMock.from).not.toHaveBeenCalledWith('profiles');
        expect(captured.profileSelect).toContain('full_name');
        expect(captured.profileSelect).toContain('cin_verified');
        expect(captured.profileSelect).not.toContain('email');
        expect(captured.profileSelect).not.toContain('phone');
    });
});
