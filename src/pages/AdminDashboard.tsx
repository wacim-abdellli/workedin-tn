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
        <div className="workspace-admin relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.1),transparent_24%),linear-gradient(180deg,#eef3fb_0%,#e8eef8_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(109,40,217,0.14),transparent_22%),linear-gradient(180deg,#050811_0%,#08101c_42%,#0a1220_100%)]">
            <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100 [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[size:88px_88px] dark:[background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />

            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/72 backdrop-blur-2xl dark:border-white/8 dark:bg-slate-950/72">
                <div className="container-custom flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 sm:items-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--workspace-primary), var(--workspace-primary-hover))', boxShadow: '0 12px 28px -10px color-mix(in srgb, var(--workspace-primary) 35%, transparent)' }}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-foreground">{tx('dashboard.admin.adminDashboard', undefined, 'Admin Dashboard')}</h1>
                            <p className="text-sm text-muted">Khedma TN • {tx('dashboard.admin.operationsCenter', undefined, 'Operations Center')}</p>
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <div className="hidden md:flex items-center gap-2 rounded-xl border border-primary-500/20 bg-primary-500/8 px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-200">
                            <Activity className="w-4 h-4" />
                            {tx('dashboard.admin.nightModeReady', undefined, 'Night mode ready')}
                        </div>
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" className="w-full justify-center border border-border bg-card hover:bg-surface sm:w-auto" onClick={() => navigate('/')}>
                            <ChevronLeft className="ms-1 w-4 h-4 rtl:rotate-180" />{tx('dashboard.admin.backToSite', undefined, 'Back to site')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="relative container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <div className="w-full lg:w-72 shrink-0">
                        <div className={`${adminPanelClass} sticky top-24 p-2.5`}>
                            <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-4 lg:grid-cols-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex w-full min-w-[140px] shrink-0 items-center justify-center gap-2.5 rounded-xl border px-3 py-3 text-start transition-all duration-300 sm:min-w-0 lg:justify-start ${
                                            activeTab === tab.id
                                                ? 'text-white border-transparent -translate-y-[1px]'
                                                : 'text-foreground border-transparent hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:border-border/50'
                                        }`}
                                        style={activeTab === tab.id ? { background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)', boxShadow: '0 16px 34px -16px color-mix(in srgb, var(--workspace-primary) 35%, transparent)' } : undefined}
                                        dir={dir}
                                    >
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-foreground/5 dark:bg-white/[0.05]'}`}>
                                            <tab.icon className="w-4 h-4" />
                                        </span>
                                        <span className="truncate whitespace-nowrap text-sm font-medium">{tab.label}</span>
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
