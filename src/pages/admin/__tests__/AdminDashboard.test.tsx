import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {},
        tx: (_k: string, _p?: Record<string, string>, fallback?: string) => fallback ?? _k,
        language: 'en',
        dir: 'ltr',
    }),
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
        <button onClick={onClick} className={className}>{children}</button>
    ),
}));

vi.mock('@/components/ui/ThemeToggle', () => ({
    default: () => <div data-testid="theme-toggle" />,
}));

vi.mock('lucide-react', () => ({
    Users: () => <span data-testid="icon-users" />,
    Briefcase: () => <span data-testid="icon-briefcase" />,
    CreditCard: () => <span data-testid="icon-credit" />,
    AlertTriangle: () => <span data-testid="icon-alert" />,
    Flag: () => <span data-testid="icon-flag" />,
    Settings: () => <span data-testid="icon-settings" />,
    BarChart3: () => <span data-testid="icon-chart" />,
    Shield: () => <span data-testid="icon-shield" />,
    ChevronLeft: () => <span data-testid="icon-chevron" />,
    default: {},
}));

vi.mock('../OverviewTab', () => ({
    default: () => <div data-testid="tab-overview">Overview Content</div>,
}));
vi.mock('../UsersTab', () => ({
    default: () => <div data-testid="tab-users">Users Content</div>,
}));
vi.mock('../JobsTab', () => ({
    default: () => <div data-testid="tab-jobs">Jobs Content</div>,
}));
vi.mock('../PaymentsTab', () => ({
    default: () => <div data-testid="tab-payments">Payments Content</div>,
}));
vi.mock('../VerificationsTab', () => ({
    default: () => <div data-testid="tab-verification">Verifications Content</div>,
}));
vi.mock('../DisputesTab', () => ({
    default: () => <div data-testid="tab-disputes">Disputes Content</div>,
}));
vi.mock('../ReportsTab', () => ({
    default: () => <div data-testid="tab-reports">Reports Content</div>,
}));
vi.mock('../SettingsTab', () => ({
    default: () => <div data-testid="tab-settings">Settings Content</div>,
}));

import AdminDashboard from '../../AdminDashboard';

function renderDashboard() {
    return render(
        <MemoryRouter>
            <AdminDashboard />
        </MemoryRouter>
    );
}

describe('AdminDashboard', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('renders the admin dashboard title', () => {
        renderDashboard();
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('renders all navigation tabs', () => {
        renderDashboard();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Jobs')).toBeInTheDocument();
        expect(screen.getByText('Payments')).toBeInTheDocument();
        expect(screen.getByText('Verification')).toBeInTheDocument();
        expect(screen.getByText('Disputes')).toBeInTheDocument();
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('shows Overview tab by default', () => {
        renderDashboard();
        expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    });

    it('switches to Users tab when clicked', () => {
        renderDashboard();
        fireEvent.click(screen.getByText('Users'));
        expect(screen.getByTestId('tab-users')).toBeInTheDocument();
        expect(screen.queryByTestId('tab-overview')).not.toBeInTheDocument();
    });

    it('persists active tab to sessionStorage', () => {
        renderDashboard();
        fireEvent.click(screen.getByText('Reports'));
        expect(sessionStorage.getItem('admin_active_tab')).toBe('reports');
    });

    it('reads initial tab from sessionStorage', () => {
        sessionStorage.setItem('admin_active_tab', 'settings');
        renderDashboard();
        expect(screen.getByTestId('tab-settings')).toBeInTheDocument();
    });

    it('falls back to overview for invalid sessionStorage value', () => {
        sessionStorage.setItem('admin_active_tab', 'nonexistent');
        renderDashboard();
        expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    });

    it('renders the back to site button', () => {
        renderDashboard();
        expect(screen.getByText('Back to site')).toBeInTheDocument();
    });

    it('renders theme toggle', () => {
        renderDashboard();
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('switches between all tabs', () => {
        renderDashboard();
        const tabs = ['Users', 'Jobs', 'Payments', 'Verification', 'Disputes', 'Reports', 'Settings'];
        for (const tab of tabs) {
            fireEvent.click(screen.getByText(tab));
            const testId = `tab-${tab.toLowerCase()}`;
            expect(screen.getByTestId(testId)).toBeInTheDocument();
        }
    });
});
