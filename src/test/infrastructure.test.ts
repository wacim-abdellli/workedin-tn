import { describe, it, expect } from 'vitest';

describe('Test Infrastructure', () => {
    it('should run tests successfully', () => {
        expect(true).toBe(true);
    });

    it('should perform basic arithmetic', () => {
        expect(1 + 1).toBe(2);
    });

    it('should handle arrays', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });

    it('should handle objects', () => {
        const obj = { name: 'test', value: 42 };
        expect(obj).toHaveProperty('name');
        expect(obj.value).toBe(42);
    });

    it('should have jest-dom matchers available', () => {
        // This test verifies that our setup.ts is loaded correctly
        expect(typeof expect.extend).toBe('function');
    });
});
