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

  it('accepts mp4-family and mp3 voice memo payloads for message attachments', () => {
    const mp4Like = validateUploadPayload({
      bucket: 'message_attachments',
      fileName: 'voice_note.m4a',
      mimeType: 'audio/mp4',
      size: 32,
      bytes: new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]),
    });

    const mp3Like = validateUploadPayload({
      bucket: 'message_attachments',
      fileName: 'voice_note.mp3',
      mimeType: 'audio/mpeg',
      size: 32,
      bytes: new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]),
    });

    expect(mp4Like).toEqual({ ok: true });
    expect(mp3Like).toEqual({ ok: true });
  });

  it('accepts newly supported image formats (heic, heif, avif, bmp)', () => {
    const heicResult = validateUploadPayload({
      bucket: 'avatars',
      fileName: 'photo.heic',
      mimeType: 'image/heic',
      size: 32,
      bytes: new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]),
    });

    const bmpResult = validateUploadPayload({
      bucket: 'avatars',
      fileName: 'photo.bmp',
      mimeType: 'image/bmp',
      size: 32,
      bytes: new Uint8Array([0x42, 0x4d, 0x36, 0x00, 0x00, 0x00]),
    });

    expect(heicResult).toEqual({ ok: true });
    expect(bmpResult).toEqual({ ok: true });
  });

  it('accepts aliased and codec-suffixed MIME values for message attachments', () => {
    expect(
      validateUploadSelection({
        bucket: 'message_attachments',
        fileName: 'voice_note.m4a',
        mimeType: 'audio/x-m4a',
        size: 2048,
      }),
    ).toEqual({ ok: true });

    expect(
      validateUploadSelection({
        bucket: 'message_attachments',
        fileName: 'voice_note.webm',
        mimeType: 'audio/webm;codecs=opus',
        size: 2048,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects message attachments whose bytes do not match the declared type', () => {
    expect(
      validateUploadPayload({
        bucket: 'message_attachments',
        fileName: 'contract.mp4',
        mimeType: 'video/mp4',
        size: 24,
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      }),
    ).toEqual({ ok: false, reason: 'File content does not match its declared type.' });
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
