import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageState = vi.hoisted(() => ({
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                upload: storageState.upload,
                getPublicUrl: storageState.getPublicUrl,
            })),
        },
    },
}));

import { formatFileSize, getFileIcon, useFileUpload } from '@/hooks/useFileUpload';

describe('useFileUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        storageState.upload.mockResolvedValue({
            data: { id: 'file-1', path: 'folder/123-brief.pdf' },
            error: null,
        });
        storageState.getPublicUrl.mockReturnValue({
            data: { publicUrl: 'https://files.example/brief.pdf' },
        });
    });

    it('uploads a valid file and returns uploaded metadata', async () => {
        const onProgress = vi.fn();
        const file = new File(['hello'], 'brief.pdf', { type: 'application/pdf' });

        const { result } = renderHook(() => useFileUpload({ bucket: 'attachments', onProgress }));

        let uploaded: Awaited<ReturnType<typeof result.current.upload>> | undefined;
        await act(async () => {
            uploaded = await result.current.upload(file, 'contract-1');
        });

        expect(storageState.upload).toHaveBeenCalledWith(
            expect.stringContaining('contract-1/'),
            file,
            { cacheControl: '3600', upsert: false }
        );
        expect(storageState.getPublicUrl).toHaveBeenCalled();
        expect(onProgress).toHaveBeenCalledWith(100);
        expect(uploaded).toEqual({
            id: 'file-1',
            name: 'brief.pdf',
            size: file.size,
            type: 'application/pdf',
            url: 'https://files.example/brief.pdf',
        });
    });

    it('rejects oversized or unsupported files and exposes reset helpers', async () => {
        const { result } = renderHook(() => useFileUpload({
            maxSizeMB: 1,
            allowedTypes: ['application/pdf'],
        }));

        const hugeFile = new File(['x'.repeat(5)], 'video.mp4', { type: 'video/mp4' });
        Object.defineProperty(hugeFile, 'size', { value: 2 * 1024 * 1024 });

        await expect(result.current.upload(hugeFile, 'contract-1')).rejects.toThrow(/الملف كبير|نوع الملف غير مدعوم/);
        expect(result.current.error).toBeNull();

        act(() => {
            result.current.reset();
        });

        expect(result.current.progress).toBe(0);
        expect(result.current.isUploading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('uploads multiple files and updates progress', async () => {
        const onProgress = vi.fn();
        const files = [
            new File(['one'], 'one.pdf', { type: 'application/pdf' }),
            new File(['two'], 'two.pdf', { type: 'application/pdf' }),
        ];

        const { result } = renderHook(() => useFileUpload({ onProgress }));

        await act(async () => {
            await result.current.uploadMultiple(files, 'contract-1');
        });

        expect(storageState.upload).toHaveBeenCalledTimes(2);
        expect(onProgress).toHaveBeenCalledWith(50);
        expect(onProgress).toHaveBeenCalledWith(100);
    });
});

describe('useFileUpload helpers', () => {
    it('maps file types to icons', () => {
        expect(getFileIcon('image/png')).toBe('🖼️');
        expect(getFileIcon('application/pdf')).toBe('📄');
        expect(getFileIcon('application/msword')).toBe('📝');
        expect(getFileIcon('application/octet-stream')).toBe('📎');
    });

    it('formats file sizes', () => {
        expect(formatFileSize(500)).toBe('500 B');
        expect(formatFileSize(2048)).toBe('2.0 KB');
        expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
    });
});
