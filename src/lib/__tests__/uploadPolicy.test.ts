import { describe, expect, it } from 'vitest';

import {
  getRawStoragePathSegments,
  isUploadRateLimited,
  sanitizeStoragePath,
  validateUploadPayload,
  validateUploadSelection,
} from '../uploadPolicy';

describe('upload policy', () => {
  it('rejects suspicious archive and executable extensions', () => {
    expect(
      validateUploadSelection({
        bucket: 'attachments',
        fileName: 'payload.zip',
        mimeType: 'application/zip',
        size: 1024,
      }),
    ).toEqual({ ok: false, reason: 'Unsupported file type.' });

    expect(
      validateUploadSelection({
        bucket: 'attachments',
        fileName: 'payload.exe',
        mimeType: 'application/octet-stream',
        size: 1024,
      }),
    ).toEqual({ ok: false, reason: 'This file type is not allowed.' });
  });

  it('rejects files whose bytes do not match the declared type', () => {
    const result = validateUploadPayload({
      bucket: 'attachments',
      fileName: 'brief.pdf',
      mimeType: 'application/pdf',
      size: 16,
      bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    });

    expect(result).toEqual({ ok: false, reason: 'File content does not match its declared type.' });
  });

  it('limits uploads that exceed the bucket rate policy', () => {
    expect(isUploadRateLimited('identity-documents', 6)).toBe(true);
    expect(isUploadRateLimited('identity-documents', 5)).toBe(false);
  });

  it('sanitizes paths and enforces user prefixes where required', () => {
    const allowed = sanitizeStoragePath({
      bucket: 'avatars',
      userId: 'user-1',
      desiredPath: 'user-1/../avatar<script>.png',
      fileName: 'avatar.png',
    });

    expect(allowed).toEqual({ ok: true, path: 'user-1/avatar_script_.png' });

    const blocked = sanitizeStoragePath({
      bucket: 'attachments',
      userId: 'user-1',
      desiredPath: 'user-2/brief.pdf',
      fileName: 'brief.pdf',
    });

    expect(blocked).toEqual({ ok: false, reason: 'Upload path must stay inside the current user scope.' });
  });

  it('keeps conversation-scoped message attachment prefixes intact', () => {
    expect(getRawStoragePathSegments('conversation-123/../1712-brief.pdf')).toEqual([
      'conversation-123',
      '1712-brief.pdf',
    ]);

    const sanitized = sanitizeStoragePath({
      bucket: 'message_attachments',
      userId: 'user-1',
      desiredPath: 'conversation-123/1712-brief<script>.pdf',
      fileName: 'brief.pdf',
    });

    expect(sanitized).toEqual({ ok: true, path: 'conversation-123/1712-brief_script_.pdf' });
  });
});
