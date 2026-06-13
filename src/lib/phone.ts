const ALLOWED_PHONE_INPUT = /^[\d+\s().-]*$/;

export function sanitizePhoneInput(value: string): string {
    const cleaned = value.replace(/[^\d+]/g, '');
    const hasLeadingPlus = cleaned.startsWith('+');
    let digits = cleaned.replace(/\D/g, '');

    if (!hasLeadingPlus && digits.startsWith('00')) {
        digits = digits.slice(2);
        return digits.length > 0 ? `+${digits.slice(0, 15)}` : '';
    }

    if (hasLeadingPlus) {
        return `+${digits.slice(0, 15)}`;
    }

    return digits.slice(0, 15);
}

export function normalizePhoneNumber(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';

    // Keep digits and a leading plus, then normalize common formatting noise.
    const normalized = sanitizePhoneInput(trimmed);

    return normalized;
}

export function isValidOptionalPhone(value: string | undefined): boolean {
    const trimmed = value?.trim() || '';
    if (!trimmed) return true;

    if (!ALLOWED_PHONE_INPUT.test(trimmed)) return false;

    const plusCount = (trimmed.match(/\+/g) || []).length;
    if (plusCount > 1) return false;
    if (plusCount === 1 && !trimmed.startsWith('+')) return false;

    const rawDigits = trimmed.replace(/\D/g, '');
    if (rawDigits.length < 8 || rawDigits.length > 15) return false;

    const normalized = normalizePhoneNumber(trimmed);
    return /^\+?\d+$/.test(normalized);
}

export function normalizeOptionalPhone(value: string | undefined): string | undefined {
    const trimmed = value?.trim() || '';
    if (!trimmed) return undefined;

    const normalized = normalizePhoneNumber(trimmed);
    return normalized || undefined;
}

export function formatPhoneAsYouType(value: string): string {
    if (!value) return '';

    // Normalize: remove any leading + or 00, and strip all non-digits
    let raw = value.trim();
    if (raw.startsWith('+')) {
        raw = raw.slice(1);
    } else if (raw.startsWith('00')) {
        raw = raw.slice(2);
    }

    let digits = raw.replace(/\D/g, '');

    // Strip the 216 country code if present at the start
    if (digits.startsWith('216')) {
        digits = digits.slice(3);
    }

    // Limit to 8 digits for Tunisia
    const tnDigits = digits.slice(0, 8);

    // Build the formatted string
    let formatted = '+216';
    if (tnDigits.length > 0) {
        formatted += ' ' + tnDigits.slice(0, 2);
    }
    if (tnDigits.length > 2) {
        formatted += ' ' + tnDigits.slice(2, 5);
    }
    if (tnDigits.length > 5) {
        formatted += ' ' + tnDigits.slice(5, 8);
    }
    return formatted;
}

