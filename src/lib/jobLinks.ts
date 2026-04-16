export type JobLinkPlatform =
  | 'google_drive'
  | 'linkedin'
  | 'github'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'tiktok'
  | 'dropbox'
  | 'behance'
  | 'figma'
  | 'website';

export interface JobReferenceLinkMeta {
  url: string;
  hostname: string;
  platform: JobLinkPlatform;
  platformLabel: string;
}

const PLATFORM_LABELS: Record<JobLinkPlatform, string> = {
  google_drive: 'Google Drive',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  tiktok: 'TikTok',
  dropbox: 'Dropbox',
  behance: 'Behance',
  figma: 'Figma',
  website: 'Website',
};

const MAX_JOB_REFERENCE_LINKS = 8;

function toHttpUrl(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

export function normalizeJobReferenceLink(rawValue: string): string {
  const candidate = toHttpUrl(rawValue);
  if (!candidate) return '';

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';

    parsed.hash = '';
    return stripTrailingSlash(parsed.toString());
  } catch {
    return '';
  }
}

export function isValidJobReferenceLink(rawValue: string): boolean {
  return normalizeJobReferenceLink(rawValue).length > 0;
}

export function sanitizeJobReferenceLinks(
  rawLinks: Array<string | null | undefined> | null | undefined,
  maxLinks: number = MAX_JOB_REFERENCE_LINKS,
): string[] {
  const seen = new Set<string>();
  const normalizedLinks: string[] = [];

  for (const rawLink of rawLinks || []) {
    if (typeof rawLink !== 'string') continue;

    const normalized = normalizeJobReferenceLink(rawLink);
    if (!normalized) continue;

    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    normalizedLinks.push(normalized);

    if (normalizedLinks.length >= maxLinks) {
      break;
    }
  }

  return normalizedLinks;
}

export function detectJobLinkPlatform(hostnameRaw: string): JobLinkPlatform {
  const hostname = hostnameRaw.toLowerCase().replace(/^www\./, '');

  if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) return 'google_drive';
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('github.com')) return 'github';
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'facebook';
  if (hostname === 'x.com' || hostname.endsWith('.x.com') || hostname.includes('twitter.com')) return 'x';
  if (hostname.includes('tiktok.com')) return 'tiktok';
  if (hostname.includes('dropbox.com')) return 'dropbox';
  if (hostname.includes('behance.net')) return 'behance';
  if (hostname.includes('figma.com')) return 'figma';

  return 'website';
}

export function getJobReferenceLinkMeta(rawValue: string): JobReferenceLinkMeta | null {
  const normalized = normalizeJobReferenceLink(rawValue);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const platform = detectJobLinkPlatform(hostname);
    return {
      url: normalized,
      hostname,
      platform,
      platformLabel: PLATFORM_LABELS[platform],
    };
  } catch {
    return null;
  }
}

function errorText(error: unknown): string {
  if (!error || typeof error !== 'object') return '';

  const maybeError = error as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };

  return [maybeError.message, maybeError.details, maybeError.hint, maybeError.code]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

export function isMissingJobReferenceLinksColumnError(error: unknown): boolean {
  const text = errorText(error);
  if (!text.includes('reference_links')) return false;

  return (
    text.includes('column')
    || text.includes('schema cache')
    || text.includes('pgrst204')
    || text.includes('does not exist')
  );
}

export { MAX_JOB_REFERENCE_LINKS };
