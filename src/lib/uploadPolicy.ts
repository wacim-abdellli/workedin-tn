export interface UploadPolicy {
  bucket: string;
  maxSizeBytes: number;
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[];
  publicUrl: boolean;
  upsert: boolean;
  requireUserPrefix: boolean;
  rateLimit: {
    maxAttempts: number;
    windowMs: number;
  };
}

export interface UploadValidationResult {
  ok: boolean;
  reason?: string;
}

const MB = 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set([
  'html', 'htm', 'svg', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'php', 'exe', 'dll', 'sh', 'bat', 'cmd', 'ps1', 'jar', 'msi', 'apk', 'com', 'scr',
]);

const RELAXED_MIME_TYPES = new Set(['', 'application/octet-stream']);

function normalizeUploadMimeType(mimeType: string | null | undefined) {
  const normalized = String(mimeType ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (!normalized) return '';

  switch (normalized) {
    case 'audio/x-wav':
      return 'audio/wav';
    case 'audio/mp3':
    case 'audio/x-mp3':
    case 'audio/x-mpeg':
      return 'audio/mpeg';
    case 'audio/x-m4a':
    case 'audio/m4a':
    case 'audio/mp4a-latm':
    case 'audio/aac':
      return 'audio/mp4';
    default:
      return normalized;
  }
}

export const UPLOAD_POLICIES: Record<string, UploadPolicy> = {
  avatars: {
    bucket: 'avatars',
    maxSizeBytes: 5 * MB,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    publicUrl: true,
    upsert: true,
    requireUserPrefix: true,
    rateLimit: { maxAttempts: 8, windowMs: 10 * 60 * 1000 },
  },
  attachments: {
    bucket: 'attachments',
    maxSizeBytes: 10 * MB,
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    publicUrl: true,
    upsert: false,
    requireUserPrefix: true,
    rateLimit: { maxAttempts: 20, windowMs: 10 * 60 * 1000 },
  },
  'contract-files': {
    bucket: 'contract-files',
    maxSizeBytes: 10 * MB,
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    publicUrl: false,
    upsert: false,
    requireUserPrefix: true,
    rateLimit: { maxAttempts: 20, windowMs: 10 * 60 * 1000 },
  },
  message_attachments: {
    bucket: 'message_attachments',
    maxSizeBytes: 15 * MB,
    allowedExtensions: [
      'pdf',
      'doc',
      'docx',
      'txt',
      'png',
      'jpg',
      'jpeg',
      'webp',
      'gif',
      'webm',
      'mp3',
      'wav',
      'ogg',
      'm4a',
      'mp4',
    ],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'audio/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
      'audio/mp4',
      'video/webm',
      'video/mp4',
    ],
    publicUrl: true,
    upsert: false,
    requireUserPrefix: false,
    rateLimit: { maxAttempts: 40, windowMs: 10 * 60 * 1000 },
  },
  'identity-documents': {
    bucket: 'identity-documents',
    maxSizeBytes: 8 * MB,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    publicUrl: false,
    upsert: true,
    requireUserPrefix: true,
    rateLimit: { maxAttempts: 6, windowMs: 60 * 60 * 1000 },
  },
};

export function getUploadPolicy(bucket: string): UploadPolicy | null {
  return UPLOAD_POLICIES[bucket] ?? null;
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

export function sanitizePathSegment(segment: string): string {
  return segment
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 80);
}

export function getRawStoragePathSegments(desiredPath: string): string[] {
  return desiredPath
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== '.' && segment !== '..');
}

function hasSignature(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function isLikelyPlainText(bytes: Uint8Array) {
  return !bytes.some((value) => value === 0);
}

function isLikelyMp3(bytes: Uint8Array) {
  if (bytes.length < 3) return false;

  if (hasSignature(bytes, [0x49, 0x44, 0x33])) {
    return true;
  }

  return bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

function isLikelyMp4Family(bytes: Uint8Array) {
  return hasSignature(bytes, [0x66, 0x74, 0x79, 0x70], 4);
}

function matchesContentSignature(extension: string, bytes: Uint8Array) {
  if (bytes.length === 0) return true;

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return hasSignature(bytes, [0xff, 0xd8, 0xff]);
    case 'png':
      return hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47]);
    case 'gif':
      return hasSignature(bytes, [0x47, 0x49, 0x46, 0x38]);
    case 'webp':
      return hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) && hasSignature(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    case 'pdf':
      return hasSignature(bytes, [0x25, 0x50, 0x44, 0x46]);
    case 'doc':
      return hasSignature(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case 'docx':
      return hasSignature(bytes, [0x50, 0x4b, 0x03, 0x04]) || hasSignature(bytes, [0x50, 0x4b, 0x05, 0x06]);
    case 'txt':
      return isLikelyPlainText(bytes);
    case 'webm':
      return hasSignature(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
    case 'mp3':
      return isLikelyMp3(bytes);
    case 'wav':
      return hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) && hasSignature(bytes, [0x57, 0x41, 0x56, 0x45], 8);
    case 'ogg':
      return hasSignature(bytes, [0x4f, 0x67, 0x67, 0x53]);
    case 'm4a':
    case 'mp4':
      return isLikelyMp4Family(bytes);
    default:
      return false;
  }
}

export function validateUploadSelection(input: {
  bucket: string;
  fileName: string;
  mimeType: string;
  size: number;
}): UploadValidationResult {
  const policy = getUploadPolicy(input.bucket);
  if (!policy) {
    return { ok: false, reason: 'Uploads are not allowed for this bucket.' };
  }

  if (input.size <= 0) {
    return { ok: false, reason: 'Empty files are not allowed.' };
  }

  if (input.size > policy.maxSizeBytes) {
    return { ok: false, reason: `File exceeds the ${Math.round(policy.maxSizeBytes / MB)}MB limit.` };
  }

  const extension = getFileExtension(input.fileName);
  if (!extension) {
    return { ok: false, reason: 'File extension is required.' };
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, reason: 'This file type is not allowed.' };
  }

  if (!policy.allowedExtensions.includes(extension)) {
    return { ok: false, reason: 'Unsupported file type.' };
  }

  const normalizedMimeType = normalizeUploadMimeType(input.mimeType);

  if (!RELAXED_MIME_TYPES.has(normalizedMimeType) && !policy.allowedMimeTypes.includes(normalizedMimeType)) {
    return { ok: false, reason: 'Unexpected MIME type for this file.' };
  }

  return { ok: true };
}

export function validateUploadPayload(input: {
  bucket: string;
  fileName: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}): UploadValidationResult {
  const selection = validateUploadSelection(input);
  if (!selection.ok) return selection;

  const extension = getFileExtension(input.fileName);
  if (!matchesContentSignature(extension, input.bytes)) {
    return { ok: false, reason: 'File content does not match its declared type.' };
  }

  return { ok: true };
}

export function sanitizeStoragePath(input: {
  bucket: string;
  userId: string;
  desiredPath: string;
  fileName: string;
}): { ok: boolean; path?: string; reason?: string } {
  const policy = getUploadPolicy(input.bucket);
  if (!policy) {
    return { ok: false, reason: 'Uploads are not allowed for this bucket.' };
  }

  const rawSegments = getRawStoragePathSegments(input.desiredPath);

  if (rawSegments.length === 0) {
    return { ok: false, reason: 'Upload path is required.' };
  }

  if (policy.requireUserPrefix && rawSegments[0] !== input.userId) {
    return { ok: false, reason: 'Upload path must stay inside the current user scope.' };
  }

  const safeSegments = rawSegments.map(sanitizePathSegment).filter(Boolean);
  if (safeSegments.length === 0) {
    return { ok: false, reason: 'Upload path is invalid.' };
  }

  const extension = getFileExtension(input.fileName);
  const lastSegment = safeSegments.at(-1) ?? 'file';
  const baseName = sanitizePathSegment(lastSegment.replace(/\.[^.]+$/, '')) || 'file';
  safeSegments[safeSegments.length - 1] = extension ? `${baseName}.${extension}` : baseName;

  return { ok: true, path: safeSegments.join('/') };
}

export function isUploadRateLimited(bucket: string, recentAttemptCount: number): boolean {
  const policy = getUploadPolicy(bucket);
  if (!policy) return true;
  return recentAttemptCount >= policy.rateLimit.maxAttempts;
}
