import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { submitReport } from '../reports';

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn) => fn())
}));

vi.mock('@/lib/supabase', async (importOriginal) => {
    const actual = await importOriginal<any>();
    
    const fromMock = {
        insert: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
    };
    fromMock.insert.mockReturnValue(fromMock);
    fromMock.select.mockReturnValue(fromMock);
    fromMock.eq.mockReturnValue(fromMock);
    fromMock.single.mockReturnValue({ error: null, data: { id: 'report-1' } });

    return {
        ...actual,
        supabase: {
            from: vi.fn(() => fromMock),
            storage: {
                from: vi.fn(() => ({
                    upload: vi.fn().mockResolvedValue({ data: { path: 'file.png' }, error: null }),
                    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'url' } })
                }))
            }
        }
    };
});

describe('reports service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submits a report', async () => {
        await submitReport(
            'user-1',
            'user',
            'user-2',
            'spam'
        );

        expect(supabase.from).toHaveBeenCalledWith('reports');
    });
});
