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
