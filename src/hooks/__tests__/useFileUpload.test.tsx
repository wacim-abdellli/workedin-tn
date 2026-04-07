import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted to the top of the file, so the factory runs before any
// module-level code. Use vi.hoisted to safely declare the mock fn reference.
const { uploadFileWithMetadataMock } = vi.hoisted(() => ({
    uploadFileWithMetadataMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    uploadFileWithMetadata: uploadFileWithMetadataMock,
}));

import { formatFileSize, getFileIcon, useFileUpload } from '@/hooks/useFileUpload';

describe('useFileUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        uploadFileWithMetadataMock.mockResolvedValue({
            path: 'user-1/contract-1/123-brief.pdf',
            publicUrl: 'https://files.example/brief.pdf',
            bucket: 'attachments',
            mimeType: 'application/pdf',
            size: 5,
        });
    });

    it('uploads a valid file via secure-upload and returns compatible metadata', async () => {
        const onProgress = vi.fn();
        const file = new File(['hello'], 'brief.pdf', { type: 'application/pdf' });

        const { result } = renderHook(() => useFileUpload({ bucket: 'attachments', onProgress }));

        let uploaded: Awaited<ReturnType<typeof result.current.upload>> | undefined;
        await act(async () => {
            uploaded = await result.current.upload(file, 'user-1/contract-1');
        });

        // Must call uploadFileWithMetadata with the correct bucket and a path
        // that starts with the user-prefixed folder provided by the caller.
        expect(uploadFileWithMetadataMock).toHaveBeenCalledWith(
            'attachments',
            expect.stringMatching(/^user-1\/contract-1\//),
            file
        );

        // The hook appends exactly one `/${timestamp}-${sanitizedName}` suffix —
        // no double-nesting. Final path is: user-1/contract-1/${ts}-brief.pdf
        const calledPath: string = uploadFileWithMetadataMock.mock.calls[0][1];
        const segments = calledPath.split('/');
        expect(segments).toHaveLength(3);
        expect(segments[0]).toBe('user-1');
        expect(segments[1]).toBe('contract-1');
        expect(segments[2]).toMatch(/^\d+-brief\.pdf$/);

        expect(onProgress).toHaveBeenCalledWith(100);
        expect(uploaded).toEqual({
            id: 'user-1/contract-1/123-brief.pdf',
            name: 'brief.pdf',
            size: file.size,
            type: 'application/pdf',
            url: 'https://files.example/brief.pdf',
        });
    });

    it('falls back to storage path when publicUrl is null (private bucket)', async () => {
        uploadFileWithMetadataMock.mockResolvedValueOnce({
            path: 'user-1/contract-1/123-brief.pdf',
            publicUrl: null,
            bucket: 'attachments',
            mimeType: 'application/pdf',
            size: 5,
        });

        const file = new File(['hello'], 'brief.pdf', { type: 'application/pdf' });
        const { result } = renderHook(() => useFileUpload({ bucket: 'attachments' }));

        let uploaded: Awaited<ReturnType<typeof result.current.upload>> | undefined;
        await act(async () => {
            uploaded = await result.current.upload(file, 'user-1/contract-1');
        });

        expect(uploaded?.url).toBe('user-1/contract-1/123-brief.pdf');
    });

    it('rejects oversized or unsupported files and exposes reset helpers', async () => {
        const { result } = renderHook(() => useFileUpload({
            maxSizeMB: 1,
            allowedTypes: ['application/pdf'],
        }));

        const hugeFile = new File(['x'.repeat(5)], 'video.mp4', { type: 'video/mp4' });
        Object.defineProperty(hugeFile, 'size', { value: 2 * 1024 * 1024 });

        await expect(result.current.upload(hugeFile, 'user-1/contract-1')).rejects.toThrow(/الملف كبير|نوع الملف غير مدعوم/);
        // Client-side rejection — secure-upload was never called
        expect(uploadFileWithMetadataMock).not.toHaveBeenCalled();

        act(() => { result.current.reset(); });
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
            await result.current.uploadMultiple(files, 'user-1/contract-1');
        });

        expect(uploadFileWithMetadataMock).toHaveBeenCalledTimes(2);
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
