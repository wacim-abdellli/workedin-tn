export type ContractChatSafetyCategory = 'contact_sharing' | 'off_platform_payment';

export interface ContractChatSafetyResult {
    blocked: boolean;
    category: ContractChatSafetyCategory | null;
    reason: string | null;
}

const CONTACT_PATTERNS = [
    /(?:https?:\/\/)?(?:wa\.me|whatsapp|t\.me|telegram|discord(?:app)?|instagram)/i,
    /(?:^|[^a-z0-9_])ig(?:[^a-z0-9_]|$)/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /(?:\+?\d[\d\s().-]{7,}\d)/,
];

const PAYMENT_PATTERNS = [
    /\b(?:pay me|send (?:me )?money|bank transfer|wire transfer|western union|moneygram)\b/i,
    /\b(?:crypto|bitcoin|usdt|binance|wallet address|outside the platform|off platform|direct payment)\b/i,
    /\b(?:d17|rib|iban|swift)\b/i,
];

export function detectContractChatSafetyRisk(content: string): ContractChatSafetyResult {
    const normalized = content.trim();
    if (!normalized) {
        return { blocked: false, category: null, reason: null };
    }

    if (CONTACT_PATTERNS.some((pattern) => pattern.test(normalized))) {
        return {
            blocked: true,
            category: 'contact_sharing',
            reason: 'Sharing direct contact details is blocked in contract chats. Keep communication on the platform for your protection.',
        };
    }

    if (PAYMENT_PATTERNS.some((pattern) => pattern.test(normalized))) {
        return {
            blocked: true,
            category: 'off_platform_payment',
            reason: 'Off-platform payment requests are blocked. Keep all payments inside platform escrow for protection.',
        };
    }

    return { blocked: false, category: null, reason: null };
}
