import { describe, expect, it } from 'vitest';

import {
    getUploadPolicy,
    getFileExtension,
    sanitizePathSegment,
    getRawStoragePathSegments,
    validateUploadSelection,
    validateUploadPayload,
    sanitizeStoragePath,
    isUploadRateLimited,
    UPLOAD_POLICIES,
} from '@/lib/uploadPolicy';

describe('uploadPolicy', () => {
    describe('getUploadPolicy', () => {
        it('returns policy for avatars', () => {
            expect(getUploadPolicy('avatars')).toBeDefined();
            expect(getUploadPolicy('avatars')?.maxSizeBytes).toBe(5 * 1024 * 1024);
        });

        it('returns null for unknown bucket', () => {
            expect(getUploadPolicy('nonexistent')).toBeNull();
        });

        it('has all expected buckets', () => {
            expect(Object.keys(UPLOAD_POLICIES)).toEqual(
                expect.arrayContaining(['avatars', 'attachments', 'contract-files', 'message_attachments', 'identity-documents'])
            );
        });
    });

    describe('getFileExtension', () => {
        it('extracts lowercase extension', () => {
            expect(getFileExtension('photo.JPG')).toBe('jpg');
        });

        it('returns empty for no extension', () => {
            expect(getFileExtension('Makefile')).toBe('');
        });

        it('handles multi-dot filenames', () => {
            expect(getFileExtension('archive.tar.gz')).toBe('gz');
        });
    });

    describe('sanitizePathSegment', () => {
        it('replaces invalid characters', () => {
            expect(sanitizePathSegment('hello world!')).toBe('hello_world_');
        });

        it('strips leading dots', () => {
            expect(sanitizePathSegment('...hidden')).toBe('hidden');
        });

        it('truncates to 80 chars', () => {
            const long = 'a'.repeat(100);
            expect(sanitizePathSegment(long)).toHaveLength(80);
        });
    });

    describe('getRawStoragePathSegments', () => {
        it('splits and trims path', () => {
            expect(getRawStoragePathSegments('user123 / file.pdf')).toEqual(['user123', 'file.pdf']);
        });

        it('filters dots and empty segments', () => {
            expect(getRawStoragePathSegments('/./file.txt')).toEqual(['file.txt']);
        });

        it('filters parent references', () => {
            expect(getRawStoragePathSegments('../secret/file.txt')).toEqual(['secret', 'file.txt']);
        });
    });

    describe('validateUploadSelection', () => {
        it('allows valid jpeg upload', () => {
            expect(validateUploadSelection({
                bucket: 'avatars',
                fileName: 'photo.jpg',
                mimeType: 'image/jpeg',
                size: 1024,
            })).toEqual({ ok: true });
        });

        it('rejects empty file', () => {
            expect(validateUploadSelection({
                bucket: 'avatars',
                fileName: 'photo.jpg',
                mimeType: 'image/jpeg',
                size: 0,
            })).toEqual({ ok: false, reason: 'Empty files are not allowed.' });
        });

        it('rejects oversized file', () => {
            expect(validateUploadSelection({
                bucket: 'avatars',
                fileName: 'photo.jpg',
                mimeType: 'image/jpeg',
                size: 10 * 1024 * 1024,
            }).ok).toBe(false);
        });

        it('rejects blocked extension', () => {
            expect(validateUploadSelection({
                bucket: 'avatars',
                fileName: 'script.js',
                mimeType: 'text/plain',
                size: 100,
            }).ok).toBe(false);
        });

        it('rejects unknown bucket', () => {
            expect(validateUploadSelection({
                bucket: 'unknown',
                fileName: 'file.pdf',
                mimeType: 'application/pdf',
                size: 100,
            }).ok).toBe(false);
        });

        it('rejects unsupported extension for bucket', () => {
            expect(validateUploadSelection({
                bucket: 'avatars',
                fileName: 'doc.pdf',
                mimeType: 'application/pdf',
                size: 100,
            }).ok).toBe(false);
        });

        it('normalizes audio MIME types', () => {
            expect(validateUploadSelection({
                bucket: 'message_attachments',
                fileName: 'voice.mp3',
                mimeType: 'audio/x-mp3',
                size: 1024,
            })).toEqual({ ok: true });
        });

        it('allows relaxed MIME types', () => {
            expect(validateUploadSelection({
                bucket: 'attachments',
                fileName: 'doc.pdf',
                mimeType: '',
                size: 1024,
            })).toEqual({ ok: true });
        });
    });

    describe('validateUploadPayload', () => {
        it('validates content signature for PNG', () => {
            const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            expect(validateUploadPayload({
                bucket: 'avatars',
                fileName: 'photo.png',
                mimeType: 'image/png',
                size: pngBytes.length,
                bytes: pngBytes,
            })).toEqual({ ok: true });
        });

        it('rejects mismatched content signature', () => {
            const fakeBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
            expect(validateUploadPayload({
                bucket: 'avatars',
                fileName: 'photo.png',
                mimeType: 'image/png',
                size: fakeBytes.length,
                bytes: fakeBytes,
            }).ok).toBe(false);
        });

        it('validates JPEG signature', () => {
            const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
            expect(validateUploadPayload({
                bucket: 'avatars',
                fileName: 'photo.jpg',
                mimeType: 'image/jpeg',
                size: jpgBytes.length,
                bytes: jpgBytes,
            })).toEqual({ ok: true });
        });
    });

    describe('sanitizeStoragePath', () => {
        it('returns valid path for user-scoped upload', () => {
            const result = sanitizeStoragePath({
                bucket: 'avatars',
                userId: 'user123',
                desiredPath: 'user123/avatar.jpg',
                fileName: 'avatar.jpg',
            });
            expect(result.ok).toBe(true);
            expect(result.path).toContain('user123');
        });

        it('rejects path outside user scope', () => {
            const result = sanitizeStoragePath({
                bucket: 'avatars',
                userId: 'user123',
                desiredPath: 'otheruser/file.jpg',
                fileName: 'file.jpg',
            });
            expect(result.ok).toBe(false);
        });

        it('rejects unknown bucket', () => {
            const result = sanitizeStoragePath({
                bucket: 'unknown',
                userId: 'u1',
                desiredPath: 'u1/file.jpg',
                fileName: 'file.jpg',
            });
            expect(result.ok).toBe(false);
        });
    });

    describe('isUploadRateLimited', () => {
        it('returns true when at limit', () => {
            expect(isUploadRateLimited('avatars', 8)).toBe(true);
        });

        it('returns false when under limit', () => {
            expect(isUploadRateLimited('avatars', 7)).toBe(false);
        });

        it('returns true for unknown bucket', () => {
            expect(isUploadRateLimited('unknown', 1)).toBe(true);
        });
    });
});
