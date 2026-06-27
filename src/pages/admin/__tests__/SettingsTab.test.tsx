import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

let mockLanguage = 'en';

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        get language() {
            return mockLanguage;
        },
        t: {},
        tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
        dir: 'ltr',
    }),
}));

import SettingsTab from '../SettingsTab';

describe('SettingsTab', () => {
    let store: Record<string, string> = {};

    beforeEach(() => {
        store = {};
        vi.spyOn(localStorage, 'getItem').mockImplementation((key) => store[key] || null);
        vi.spyOn(localStorage, 'setItem').mockImplementation((key, val) => {
            store[key] = String(val);
        });
        vi.spyOn(localStorage, 'clear').mockImplementation(() => {
            store = {};
        });
        mockLanguage = 'en';
    });

    it('renders with default values', () => {
        render(<SettingsTab />);
        expect(screen.getByText('Admin dashboard settings')).toBeInTheDocument();
        expect(screen.getByText('Auto refresh')).toBeInTheDocument();
        expect(screen.getByText('System health')).toBeInTheDocument();
        expect(screen.getByText('Stable')).toBeInTheDocument();
    });

    it('checkbox reflects auto-refresh state', () => {
        render(<SettingsTab />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
    });

    it('checkbox can be toggled', () => {
        render(<SettingsTab />);
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it('allows changing refresh interval via AdminSelect', async () => {
        render(<SettingsTab />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('20 seconds'));
        await waitFor(() => {
            expect(localStorage.getItem('admin_refresh_interval')).toBe('20');
        });
    });

    it('supports French and Arabic translation rendering', () => {
        mockLanguage = 'fr';
        const { rerender } = render(<SettingsTab />);
        expect(screen.getByText('Parametres du tableau admin')).toBeInTheDocument();

        mockLanguage = 'ar';
        rerender(<SettingsTab />);
        expect(screen.getByText('إعدادات لوحة الإدارة')).toBeInTheDocument();
    });
});
