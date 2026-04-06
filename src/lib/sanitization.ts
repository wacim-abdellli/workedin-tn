import DOMPurify, { type Config } from 'dompurify';

export type SanitizationPolicy = 'plainText' | 'limitedHtml';

const BASE_CONFIG = {
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

const POLICY_CONFIG: Record<SanitizationPolicy, Config> = {
  plainText: {
    ...BASE_CONFIG,
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  },
  limitedHtml: {
    ...BASE_CONFIG,
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_TAGS: ['style', 'script'],
    FORBID_ATTR: ['style'],
  },
};

export function sanitizeHtml(input: string, policy: SanitizationPolicy = 'plainText'): string {
  return String(DOMPurify.sanitize(input, POLICY_CONFIG[policy]));
}

export function sanitizeText(input: string): string {
  return sanitizeHtml(input, 'plainText').trim();
}
