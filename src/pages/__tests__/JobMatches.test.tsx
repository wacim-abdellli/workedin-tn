import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import React from 'react';
import JobMatches from '../JobMatches';
import { supabase } from '@/lib/supabase';

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useParams: vi.fn(() => ({ jobId: 'job-123' })),
        useNavigate: vi.fn(() => mockNavigate),
    };
});

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

let mockLanguage = 'en';

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {
            jobMatches: {
                searchError: 'Search error',
                contractCreated: 'Contract created successfully',
                contractError: 'Failed to create contract',
            },
            selection: {
                topMatches: 'Top matches',
                matchScore: 'match score',
                hours: 'hours',
                completionRate: 'completion rate',
                workSamples: 'Work samples',
                readMore: 'Read more',
                viewFullProfile: 'View full profile',
                select: 'Select',
                confirmSelection: 'Confirm selection',
                cancel: 'Cancel',
                startWork: 'Start work',
                voiceIntro: 'Voice intro',
            },
        },
        tx: vi.fn((key: string, _params?: Record<string, string>, fallback?: string) => fallback ?? key),
        get language() {
            return mockLanguage;
        },
    }),
}));

vi.mock('@/components/layout', () => ({
    Header: () => <header>Header</header>,
}));

vi.mock('@/components/common/OptimizedImage', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

let mockSingleResult: { data: unknown | null; error: Error | null } = { data: null, error: null };
let mockInResult: { data: unknown[] | null; error: Error | null } = { data: null, error: null };
let mockInsertResult: { data: unknown | null; error: Error | null } = { data: null, error: null };

// We track which call is single() returning to return correct mocks
let singleCallCount = 0;

vi.mock('@/lib/supabase', () => {
    const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        single: vi.fn(async () => {
            singleCallCount++;
            if (singleCallCount === 1) {
                return mockSingleResult;
            }
            return mockInsertResult;
        }),
        then: vi.fn((resolve: (val: unknown) => unknown) => {
            return Promise.resolve(resolve(mockInResult));
        }),
    };
    return {
        supabase: {
            from: vi.fn(() => builder),
        },
    };
});

describe('JobMatches page UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockReset();
        mockShowToast.mockReset();
        mockSingleResult = { data: null, error: null };
        mockInResult = { data: null, error: null };
        mockInsertResult = { data: null, error: null };
        singleCallCount = 0;
        mockLanguage = 'en';
    });

    it('renders loading indicator initially', () => {
        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );
        expect(screen.getByRole('banner')).toBeDefined();
    });

    it('renders error message when fetch fails', async () => {
        mockSingleResult = { data: null, error: new Error('Job fetch error') };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('Search error', 'error');
        });
    });

    it('renders matches list and handles card expansion, voice play, and navigation', async () => {
        // Mock job details
        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                client_id: 'client-1',
                required_skills: [{ skill_id: 'skill-1' }],
            },
            error: null,
        };

        // Mock freelancer list
        mockInResult = {
            data: [
                {
                    id: 'fl-1',
                    full_name: 'John Doe',
                    avatar_url: 'avatar.png',
                    location: 'Tunis',
                    completion_rate: 95,
                    response_time_hours: 2,
                    cin_verified: true,
                    bio: 'Experienced React developer',
                    voice_intro_url: 'voice.mp3',
                    skills: [
                        { skill: { id: 'skill-1', name_en: 'React' } },
                    ],
                    work_samples: [
                        { id: 'sample-1', thumbnail_url: 'sample.png' },
                    ],
                },
            ],
            error: null,
        };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        // Wait for page load
        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        // Check freelancer elements
        expect(screen.getByText('John Doe')).toBeDefined();
        expect(screen.getByText('99% match score')).toBeDefined();
        expect(screen.getByText('React')).toBeDefined();

        // Test expand/collapse bio
        const readMoreBtn = screen.getByText(/Read more/i);
        fireEvent.click(readMoreBtn);
        expect(screen.getByText('Experienced React developer')).toBeDefined();

        // Test play voice
        const playVoiceBtn = screen.getByRole('button', { name: /Voice intro/i });
        fireEvent.click(playVoiceBtn);
        expect(screen.getByText('dynamic_key_1225650541')).toBeDefined(); // paused status translation key

        // Click view full profile
        const viewProfileBtn = screen.getByRole('button', { name: /View full profile/i });
        fireEvent.click(viewProfileBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/freelancer/fl-1');

        // Test back button
        const backBtn = screen.getByText('dynamic_key_48788556'); // Back translation key
        fireEvent.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('handles contract selection confirmation and navigation flow', async () => {
        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                client_id: 'client-1',
                required_skills: [{ skill_id: 'skill-1' }],
            },
            error: null,
        };

        mockInResult = {
            data: [
                {
                    id: 'fl-1',
                    full_name: 'John Doe',
                    completion_rate: 95,
                    skills: [{ skill: { id: 'skill-1', name_en: 'React' } }],
                },
            ],
            error: null,
        };

        mockInsertResult = {
            data: {
                id: 'contract-456',
            },
            error: null,
        };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        // Wait for page load
        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        // Click select button
        const selectBtn = screen.getByRole('button', { name: /Select/i });
        fireEvent.click(selectBtn);

        // Expect confirm modal to open
        expect(screen.getByText('Confirm selection')).toBeDefined();

        // Click start work
        const startWorkBtn = screen.getByRole('button', { name: /Start work/i });
        fireEvent.click(startWorkBtn);

        // Expect navigation to newly created contract
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/contracts/contract-456');
            expect(mockShowToast).toHaveBeenCalledWith('Contract created successfully', 'success');
        });
    });

    it('handles cancel on confirmation modal', async () => {
        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                required_skills: [],
            },
            error: null,
        };

        mockInResult = {
            data: [
                {
                    id: 'fl-1',
                    full_name: 'John Doe',
                    completion_rate: 95,
                    skills: [],
                },
            ],
            error: null,
        };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        // Open modal
        fireEvent.click(screen.getByRole('button', { name: /Select/i }));
        expect(screen.getByText('Confirm selection')).toBeDefined();

        // Click cancel
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

        // Modal should close
        await waitFor(() => {
            expect(screen.queryByText('Confirm selection')).toBeNull();
        });
    });

    it('handles cancel using close button on confirmation modal', async () => {
        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                required_skills: [],
            },
            error: null,
        };

        mockInResult = {
            data: [
                {
                    id: 'fl-1',
                    full_name: 'John Doe',
                    completion_rate: 95,
                    skills: [],
                },
            ],
            error: null,
        };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        // Open modal
        fireEvent.click(screen.getByRole('button', { name: /Select/i }));
        expect(screen.getByText('Confirm selection')).toBeDefined();

        // Click close button of modal (aria-label "Close modal")
        const closeBtn = screen.getByLabelText('Close modal');
        fireEvent.click(closeBtn);

        // Modal should close
        await waitFor(() => {
            expect(screen.queryByText('Confirm selection')).toBeNull();
        });
    });

    it('handles contract selection insert failure and edge cases', async () => {
        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                client_id: 'client-1',
                required_skills: [{ skill_id: 'skill-1' }],
            },
            error: null,
        };

        mockInResult = {
            data: [
                {
                    id: 'fl-1',
                    full_name: 'John Doe',
                    completion_rate: 95,
                    skills: [{ skill: { id: 'skill-1', name_en: 'React' } }],
                },
            ],
            error: null,
        };

        // Mock error on insert
        mockInsertResult = {
            data: null,
            error: new Error('Failed to create contract'),
        };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        // Open modal and confirm
        fireEvent.click(screen.getByRole('button', { name: /Select/i }));
        fireEvent.click(screen.getByRole('button', { name: /Start work/i }));

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('Failed to create contract', 'error');
        });
    });

    it('handles contract selection insert failure with generic error object', async () => {
        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                client_id: 'client-1',
                required_skills: [{ skill_id: 'skill-1' }],
            },
            error: null,
        };

        mockInResult = {
            data: [
                {
                    id: 'fl-1',
                    full_name: 'John Doe',
                    completion_rate: 95,
                    skills: [{ skill: { id: 'skill-1', name_en: 'React' } }],
                },
            ],
            error: null,
        };

        // Mock string/generic error on insert (not an Error instance with message)
        mockInsertResult = {
            data: null,
            error: {} as Error,
        };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        // Open modal and confirm
        fireEvent.click(screen.getByRole('button', { name: /Select/i }));
        fireEvent.click(screen.getByRole('button', { name: /Start work/i }));

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('Failed to create contract', 'error');
        });
    });

    it('handles missing jobId parameter', () => {
        vi.mocked(useParams).mockReturnValueOnce({ jobId: undefined });
        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );
        expect(screen.getByRole('banner')).toBeDefined();
    });

    it('handles voice play audioRef pausing and toggling', async () => {
        const mockPause = vi.fn();
        const originalAudio = window.Audio;
        window.Audio = vi.fn().mockImplementation(function () {
            return {
                pause: mockPause,
                play: vi.fn(),
            };
        }) as any;

        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                required_skills: [],
            },
            error: null,
        };

        mockInResult = {
            data: [
                {
                    id: 'fl-1',
                    full_name: 'John Doe',
                    completion_rate: 95,
                    voice_intro_url: 'voice.mp3',
                    skills: [],
                },
                {
                    id: 'fl-2',
                    full_name: 'Jane Doe',
                    completion_rate: 90,
                    voice_intro_url: 'voice2.mp3',
                    skills: [],
                },
            ],
            error: null,
        };

        render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        // Play voice of fl-1
        const playVoiceBtns = screen.getAllByRole('button', { name: /Voice intro/i });
        fireEvent.click(playVoiceBtns[0]);

        // Toggle pause for fl-1
        fireEvent.click(playVoiceBtns[0]);

        // Play voice of fl-2 to trigger pausing fl-1
        fireEvent.click(playVoiceBtns[1]);

        expect(mockPause).toHaveBeenCalled();

        window.Audio = originalAudio;
    });

    it('handles sorting tie-breakers and skill translation logic', async () => {
        mockSingleResult = {
            data: {
                id: 'job-123',
                title: 'Develop landing page',
                budget: 500,
                required_skills: [],
            },
            error: null,
        };

        // Mock 4 freelancers with same match score
        mockInResult = {
            data: [
                {
                    id: 'fl-b',
                    full_name: 'Jane Doe B',
                    completion_rate: 95,
                    response_time_hours: 4,
                    skills: [{ skill: { id: 'skill-1', name_fr: 'React FR', name_ar: 'React AR', name_en: 'React EN' } }],
                },
                {
                    id: 'fl-c',
                    full_name: 'Jane Doe C',
                    completion_rate: 90,
                    response_time_hours: 2,
                    skills: [],
                },
                {
                    id: 'fl-d',
                    full_name: 'Jane Doe D',
                    completion_rate: 95,
                    response_time_hours: 2,
                    skills: [],
                },
                {
                    id: 'fl-a',
                    full_name: 'Jane Doe A',
                    completion_rate: 95,
                    response_time_hours: 2,
                    skills: [],
                },
            ],
            error: null,
        };

        // Test French translations
        mockLanguage = 'fr';
        const { rerender } = render(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Develop landing page')).toBeDefined();
        });

        expect(screen.getByText('React FR')).toBeDefined();

        // Test Arabic translations
        mockLanguage = 'ar';
        rerender(
            <MemoryRouter>
                <JobMatches />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('React AR')).toBeDefined();
        });
    });
});
