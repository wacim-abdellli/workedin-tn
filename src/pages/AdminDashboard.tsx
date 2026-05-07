import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, CreditCard, AlertTriangle, Flag,
    Settings, BarChart3, Shield, ChevronLeft,
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

const ACTIVE_TAB_KEY = 'admin_active_tab';

type Tab = 'overview' | 'users' | 'jobs' | 'payments' | 'verifications' | 'disputes' | 'reports' | 'settings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { tx } = useTranslation();

    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const stored = sessionStorage.getItem(ACTIVE_TAB_KEY);
        const allowed: Tab[] = ['overview', 'users', 'jobs', 'payments', 'verifications', 'disputes', 'reports', 'settings'];
        return stored && allowed.includes(stored as Tab) ? (stored as Tab) : 'overview';
    });

    useEffect(() => {
        sessionStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    }, [activeTab]);

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: tx('admin.tabs.overview', undefined, 'Overview'), icon: BarChart3 },
        { id: 'users', label: tx('admin.tabs.users', undefined, 'Users'), icon: Users },
        { id: 'jobs', label: tx('admin.tabs.jobs', undefined, 'Jobs'), icon: Briefcase },
        { id: 'payments', label: tx('admin.tabs.payments', undefined, 'Payments'), icon: CreditCard },
        { id: 'verifications', label: tx('admin.tabs.verifications', undefined, 'Verification'), icon: Shield },
        { id: 'disputes', label: tx('admin.tabs.disputes', undefined, 'Disputes'), icon: AlertTriangle },
        { id: 'reports', label: tx('admin.tabs.reports', undefined, 'Reports'), icon: Flag },
        { id: 'settings', label: tx('admin.tabs.settings', undefined, 'Settings'), icon: Settings },
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
        <div className="h-screen flex flex-col bg-[var(--color-bg-subtle)] overflow-hidden">
            {/* Header */}
            <header className="shrink-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/80 backdrop-blur-xl">
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{tx('admin.title', undefined, 'Admin Dashboard')}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{tx('admin.subtitle', undefined, 'System Control Center')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate('/')}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                                {tx('admin.backToSite', undefined, 'Back to site')}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1400px] mx-auto px-6 py-8">
                    <div className="flex gap-6">
                        {/* Sidebar */}
                        <div className="w-64 shrink-0">
                            <div className="sticky top-0 space-y-1">
                                <div className="px-3 mb-4">
                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{tx('common.navigate', undefined, 'Navigation')}</p>
                                </div>
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {renderTab()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

