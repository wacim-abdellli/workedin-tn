import { supabase } from './supabase';

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const DATA_IMAGE_REGEX = /^data:image\//i;
const ATTACHMENTS_PREFIX_REGEX = /^attachments\//i;

function normalizeStringList(values: Array<string | null | undefined> | null | undefined): string[] {
    return (values ?? [])
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);
}

function uniquePreserveOrder(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        const normalized = value.toLowerCase();
        if (seen.has(normalized)) {
            return false;
        }

        seen.add(normalized);
        return true;
    });
}

export function resolvePortfolioMediaUrl(value: string | null | undefined): string {
    if (typeof value !== 'string') {
        return '';
    }

    const normalized = value.trim();
    if (!normalized) {
        return '';
    }

    if (ABSOLUTE_URL_REGEX.test(normalized) || DATA_IMAGE_REGEX.test(normalized)) {
        return normalized;
    }

    const normalizedPath = normalized
        .replace(/^\/+/, '')
        .replace(ATTACHMENTS_PREFIX_REGEX, '');

    if (!normalizedPath || normalizedPath.includes('..')) {
        return '';
    }

    return supabase.storage.from('attachments').getPublicUrl(normalizedPath).data.publicUrl;
}

export function getPortfolioImageUrl(
    thumbnailUrl: string | null | undefined,
    mediaUrls: Array<string | null | undefined> | null | undefined,
): string {
    const candidates = [thumbnailUrl, ...(mediaUrls ?? [])];

    for (const candidate of candidates) {
        const resolved = resolvePortfolioMediaUrl(candidate);
        if (resolved) {
            return resolved;
        }
    }

    return '';
}

export function normalizePortfolioMediaFields(
    thumbnailUrl: string | null | undefined,
    mediaUrls: Array<string | null | undefined> | null | undefined,
): {
    normalizedThumbnailUrl: string;
    normalizedMediaUrls: string[];
    changed: boolean;
} {
    const originalMediaUrls = normalizeStringList(mediaUrls);
    const originalThumbnailUrl = typeof thumbnailUrl === 'string' ? thumbnailUrl.trim() : '';

    const normalizedMediaUrls = uniquePreserveOrder(
        normalizeStringList(
            originalMediaUrls.map((value) => resolvePortfolioMediaUrl(value) || value),
        ),
    );

    const normalizedThumbnailUrl =
        resolvePortfolioMediaUrl(originalThumbnailUrl)
        || normalizedMediaUrls[0]
        || '';

    const changed =
        originalThumbnailUrl !== normalizedThumbnailUrl
        || originalMediaUrls.length !== normalizedMediaUrls.length
        || originalMediaUrls.some((value, index) => value !== normalizedMediaUrls[index]);

    return {
        normalizedThumbnailUrl,
        normalizedMediaUrls,
        changed,
    };
}
