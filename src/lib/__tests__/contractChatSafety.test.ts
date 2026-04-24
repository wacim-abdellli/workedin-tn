import { describe, expect, it } from 'vitest';

import { detectContractChatSafetyRisk } from '@/lib/contractChatSafety';

describe('contractChatSafety', () => {
    it('allows normal contract messages', () => {
        expect(detectContractChatSafetyRisk('I will send the revised homepage tonight.')).toEqual({
            blocked: false,
            category: null,
            reason: null,
        });
    });

    it('does not flag benign words that contain ig', () => {
        expect(detectContractChatSafetyRisk('This is a big deliverable and a bigger timeline.')).toEqual({
            blocked: false,
            category: null,
            reason: null,
        });
    });

    it('blocks direct contact sharing', () => {
        const result = detectContractChatSafetyRisk('Message me on WhatsApp at +216 12 345 678');
        expect(result.blocked).toBe(true);
        expect(result.category).toBe('contact_sharing');
    });

    it('blocks off-platform payment attempts', () => {
        const result = detectContractChatSafetyRisk('Pay me by bank transfer outside the platform');
        expect(result.blocked).toBe(true);
        expect(result.category).toBe('off_platform_payment');
    });
});
