import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { MockUpload, mockTusStart, mockTusAbort, getMockTusInstance, setMockTusInstance } = vi.hoisted(() => {
    const mockTusStart = vi.fn();
    const mockTusAbort = vi.fn();
    let instance: any = null;

    class MockUpload {
        constructor(public file: File, public options: any) {
            instance = this;
        }
        start = mockTusStart;
        abort = mockTusAbort;
    }

    return {
        MockUpload,
        mockTusStart,
        mockTusAbort,
        getMockTusInstance: () => instance,
        setMockTusInstance: (val: any) => { instance = val; },
    };
});

vi.mock('tus-js-client', () => {
    return {
        Upload: MockUpload,
    };
});

let sessionToken: string | null = 'token-123';
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(async () => ({
                data: { session: sessionToken ? { access_token: sessionToken } : null },
                error: null,
            })),
        },
    },
}));

import { useTusUpload } from '@/hooks/useTusUpload';

describe('useTusUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionToken = 'token-123';
        setMockTusInstance(null);
    });

    const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('performs upload successfully', async () => {
        const { result } = renderHook(() => useTusUpload());

        expect(result.current.isUploading).toBe(false);
        expect(result.current.progress).toBe(0);
        expect(result.current.error).toBeNull();

        const file = new File(['file content'], 'document.pdf', { type: 'application/pdf' });
        
        const uploadPromise = result.current.uploadFile(file, 'bucket', 'document.pdf');

        // Flush promises to construct MockUpload
        await act(async () => {
            await flushPromises();
        });

        const instance = getMockTusInstance();
        expect(instance).not.toBeNull();

        // Trigger TUS progress
        act(() => {
            instance!.options.onProgress(50, 100);
        });

        expect(result.current.progress).toBe(50);

        // Resolve TUS success
        act(() => {
            instance!.options.onSuccess();
        });

        await act(async () => {
            await uploadPromise;
        });

        expect(result.current.isUploading).toBe(false);
        expect(result.current.progress).toBe(100);
        expect(result.current.error).toBeNull();
    });

    it('handles authentication error when session is missing', async () => {
        sessionToken = null;
        const { result } = renderHook(() => useTusUpload());

        const file = new File(['file content'], 'document.pdf', { type: 'application/pdf' });

        await act(async () => {
            await expect(result.current.uploadFile(file, 'bucket', 'document.pdf')).rejects.toThrow(
                'Authentication session not found. Please log in.'
            );
        });

        expect(result.current.isUploading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Authentication session not found. Please log in.');
    });

    it('pauses and resumes upload', async () => {
        const { result } = renderHook(() => useTusUpload());

        const file = new File(['file content'], 'document.pdf', { type: 'application/pdf' });

        const uploadPromise = result.current.uploadFile(file, 'bucket', 'document.pdf');

        await act(async () => {
            await flushPromises();
        });

        const instance = getMockTusInstance();
        expect(instance).not.toBeNull();
        expect(result.current.isUploading).toBe(true);

        act(() => {
            result.current.pause();
        });

        expect(result.current.isUploading).toBe(false);
        expect(mockTusAbort).toHaveBeenCalled();

        act(() => {
            result.current.resume();
        });

        expect(result.current.isUploading).toBe(true);
        expect(mockTusStart).toHaveBeenCalled();
    });

    it('handles TUS client error during upload', async () => {
        const { result } = renderHook(() => useTusUpload());

        const file = new File(['file content'], 'document.pdf', { type: 'application/pdf' });

        const uploadPromise = result.current.uploadFile(file, 'bucket', 'document.pdf');

        await act(async () => {
            await flushPromises();
        });

        const instance = getMockTusInstance();
        expect(instance).not.toBeNull();

        // Trigger TUS error callback
        act(() => {
            instance!.options.onError(new Error('TUS upload failed'));
        });

        await act(async () => {
            await expect(uploadPromise).rejects.toThrow('TUS upload failed');
        });

        expect(result.current.isUploading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('TUS upload failed');
    });

    it('resets upload state correctly', async () => {
        const { result } = renderHook(() => useTusUpload());

        const file = new File(['file content'], 'document.pdf', { type: 'application/pdf' });

        const uploadPromise = result.current.uploadFile(file, 'bucket', 'document.pdf');

        await act(async () => {
            await flushPromises();
        });

        const instance = getMockTusInstance();
        
        act(() => {
            instance!.options.onSuccess();
        });

        await act(async () => {
            await uploadPromise;
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.progress).toBe(0);
        expect(result.current.isUploading).toBe(false);
        expect(result.current.error).toBeNull();
    });
});
