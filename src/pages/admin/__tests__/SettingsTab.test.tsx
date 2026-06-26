import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        language: 'en',
        t: {},
        tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
        dir: 'ltr',
    }),
}));

import SettingsTab from '../SettingsTab';

describe('SettingsTab', () => {
    beforeEach(() => {
        localStorage.clear();
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
});
