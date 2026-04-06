import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, CreditCard, AlertTriangle, Flag,
    Settings, BarChart3, Shield, ChevronLeft, Activity,
} from 'lucide-react';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useTranslation } from '../i18n';
import UsersTab from './admin/UsersTab';
import JobsTab from './admin/JobsTab';
import VerificationsTab from './admin/VerificationsTab';
import ReportsTab from './admin/ReportsTab';
import PaymentsTab from './admin/PaymentsTab';
import DisputesTab from './admin/DisputesTab';
import SettingsTab from './admin/SettingsTab';
import OverviewTab from './admin/OverviewTab';
import { adminPanelClass } from './admin/adminTheme';

const ACTIVE_TAB_KEY = 'admin_active_tab';

type Tab = 'overview' | 'users' | 'jobs' | 'payments' | 'verifications' | 'disputes' | 'reports' | 'settings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { dir, tx } = useTranslation();

    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const stored = sessionStorage.getItem(ACTIVE_TAB_KEY);
        const allowed: Tab[] = ['overview', 'users', 'jobs', 'payments', 'verifications', 'disputes', 'reports', 'settings'];
        return stored && allowed.includes(stored as Tab) ? (stored as Tab) : 'overview';
    });

    useEffect(() => {
        sessionStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    }, [activeTab]);

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: tx('dashboard.admin.overview', undefined, 'Overview'), icon: BarChart3 },
        { id: 'users', label: tx('dashboard.admin.users', undefined, 'Users'), icon: Users },
        { id: 'jobs', label: tx('dashboard.admin.jobs', undefined, 'Jobs'), icon: Briefcase },
        { id: 'payments', label: tx('dashboard.admin.payments', undefined, 'Payments'), icon: CreditCard },
        { id: 'verifications', label: tx('dashboard.admin.verification', undefined, 'Verification'), icon: Shield },
        { id: 'disputes', label: tx('dashboard.admin.disputes', undefined, 'Disputes'), icon: AlertTriangle },
        { id: 'reports', label: tx('dashboard.admin.reports', undefined, 'Reports'), icon: Flag },
        { id: 'settings', label: tx('dashboard.admin.settings', undefined, 'Settings'), icon: Settings },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'users': return <UsersTab />;
            case 'jobs': return <JobsTab />;
            case 'payments': return <PaymentsTab />;
            case 'verifications': return <VerificationsTab />;
            case 'disputes': return <DisputesTab />;
            case 'reports': return <ReportsTab />;
            case 'settings': return <SettingsTab />;
            default: return null;
        }
    };

    return (
        <div className="workspace-admin relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#eef2fb_0%,#e8eef9_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(80,70,229,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_18%),linear-gradient(180deg,#050812_0%,#09111f_44%,#0b1323_100%)]">
            <div className="pointer-events-none absolute inset-0 opacity-55 dark:opacity-100 [background-image:linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px)] bg-[size:88px_88px] dark:[background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-violet-500/8 to-transparent dark:from-violet-500/10" />

            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-2xl dark:border-white/8 dark:bg-[#070b15]/78">
                <div className="container-custom flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 sm:items-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-brand-primary), var(--color-brand-primary-hover))', boxShadow: '0 12px 28px -10px rgba(147, 51, 234, 0.35)' }}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-foreground">{tx('dashboard.admin.adminDashboard', undefined, 'Admin Dashboard')}</h1>
                            <p className="text-sm text-muted">Khedma TN • {tx('dashboard.admin.operationsCenter', undefined, 'Operations Center')}</p>
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <div className="hidden md:flex items-center gap-[var(--spacing-2)] rounded-xl border border-white/10 bg-white/[0.04] px-[var(--spacing-3)] py-[var(--spacing-2)] text-[var(--font-fontSize-sm)] font-[var(--font-fontWeight-medium)] text-violet-200 dark:text-violet-100">
                            <Activity className="w-4 h-4" />
                            {tx('dashboard.admin.nightModeReady', undefined, 'Night mode ready')}
                        </div>
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" className="w-full justify-center border border-[var(--color-border-default)] bg-[var(--color-background-elevated)] hover:bg-[var(--color-background-subtle)] sm:w-auto" onClick={() => navigate('/')}>
                            <ChevronLeft className="ms-1 w-4 h-4 rtl:rotate-180" />{tx('dashboard.admin.backToSite', undefined, 'Back to site')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="relative container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <div className="w-full lg:w-[16.5rem] shrink-0">
                        <div className={`${adminPanelClass} sticky top-24 p-3`}>
                            <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{tx('dashboard.admin.controlCenter', undefined, 'Control Center')}</div>
                            <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-4 lg:grid-cols-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex w-full min-w-[140px] shrink-0 items-center justify-center gap-[var(--spacing-3)] rounded-[1rem] border px-[var(--spacing-3)] py-[var(--spacing-3)] text-start transition-all duration-[var(--animation-hover-duration)] sm:min-w-0 lg:justify-start ${
                                            activeTab === tab.id
                                                ? 'text-white border-transparent -translate-y-[1px]'
                                                : 'text-[var(--color-text-primary)] border-transparent hover:bg-white/70 dark:hover:bg-white/[0.05] hover:border-[var(--color-border-subtle)]'
                                        }`}
                                        style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 55%, #a855f7 100%)', boxShadow: '0 18px 34px -18px rgba(147, 51, 234, 0.55)' } : undefined}
                                        dir={dir}
                                    >
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${activeTab === tab.id ? 'bg-white/18 text-white' : 'bg-black/[0.04] dark:bg-white/[0.05]'}`}>
                                            <tab.icon className="w-4 h-4" />
                                        </span>
                                        <span className="truncate whitespace-nowrap text-[var(--font-fontSize-sm)] font-semibold">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        {renderTab()}
                    </div>
                </div>
            </div>
        </div>
    );
}
