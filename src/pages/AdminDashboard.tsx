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

const ACTIVE_TAB_KEY = 'admin_active_tab';

type Tab = 'overview' | 'users' | 'jobs' | 'payments' | 'verifications' | 'disputes' | 'reports' | 'settings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { language, dir } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const stored = sessionStorage.getItem(ACTIVE_TAB_KEY);
        const allowed: Tab[] = ['overview', 'users', 'jobs', 'payments', 'verifications', 'disputes', 'reports', 'settings'];
        return stored && allowed.includes(stored as Tab) ? (stored as Tab) : 'overview';
    });

    useEffect(() => {
        sessionStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    }, [activeTab]);

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: tr('نظرة عامة', 'Overview', 'Vue d\'ensemble'), icon: BarChart3 },
        { id: 'users', label: tr('المستخدمون', 'Users', 'Utilisateurs'), icon: Users },
        { id: 'jobs', label: tr('الوظائف', 'Jobs', 'Offres'), icon: Briefcase },
        { id: 'payments', label: tr('المدفوعات', 'Payments', 'Paiements'), icon: CreditCard },
        { id: 'verifications', label: tr('التحقق', 'Verification', 'Verification'), icon: Shield },
        { id: 'disputes', label: tr('النزاعات', 'Disputes', 'Litiges'), icon: AlertTriangle },
        { id: 'reports', label: tr('البلاغات', 'Reports', 'Signalements'), icon: Flag },
        { id: 'settings', label: tr('الإعدادات', 'Settings', 'Parametres'), icon: Settings },
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
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_circle_at_10%_10%,rgba(21,84,247,0.12),transparent_45%),radial-gradient(900px_circle_at_90%_5%,rgba(147,51,234,0.14),transparent_35%),linear-gradient(180deg,#f4f7ff_0%,#edf2fb_100%)] dark:bg-[radial-gradient(1100px_circle_at_8%_12%,rgba(14,65,227,0.2),transparent_42%),radial-gradient(900px_circle_at_92%_8%,rgba(147,51,234,0.16),transparent_36%),linear-gradient(180deg,#070b14_0%,#0a1220_100%)]">
            <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-80 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(21,84,247,0.2),transparent_24%),radial-gradient(circle_at_30%_78%,rgba(248,101,69,0.14),transparent_26%)]" />

            <header className="sticky top-0 z-40 border-b border-white/35 dark:border-white/10 bg-white/72 dark:bg-slate-950/58 backdrop-blur-2xl">
                <div className="container-custom flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 sm:items-center">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1554f7] to-[#9333ea] shadow-lg shadow-[#1554f7]/35 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-foreground">{tr('لوحة الإدارة', 'Admin Dashboard', 'Tableau de bord admin')}</h1>
                            <p className="text-sm text-muted">Khedma TN • {tr('مركز المراقبة', 'Operations Center', 'Centre de supervision')}</p>
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-primary-500/25 bg-primary-500/10 text-primary-700 dark:text-primary-300 text-sm font-medium">
                            <Activity className="w-4 h-4" />
                            {tr('الوضع الليلي جاهز', 'Night mode ready', 'Mode nuit pret')}
                        </div>
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" className="w-full justify-center border border-white/45 bg-white/75 dark:border-white/15 dark:bg-slate-900/65 sm:w-auto" onClick={() => navigate('/')}>
                            <ChevronLeft className="ms-1 w-4 h-4 rtl:rotate-180" />{tr('العودة للموقع', 'Back to site', 'Retour au site')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="relative container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <div className="w-full lg:w-72 shrink-0">
                        <div className="card p-2.5 bg-white/78 dark:bg-slate-950/60 backdrop-blur-2xl border-white/45 dark:border-white/10 shadow-[0_20px_56px_-30px_rgba(21,84,247,0.36)] sticky top-24">
                            <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-4 lg:grid-cols-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex w-full min-w-[140px] shrink-0 items-center justify-center gap-2.5 rounded-xl border px-3 py-3 text-start transition-all duration-300 sm:min-w-0 lg:justify-start ${
                                            activeTab === tab.id
                                                ? 'bg-gradient-to-r from-[#1554f7] to-[#9333ea] text-white border-transparent shadow-lg shadow-[#1554f7]/35 -translate-y-[1px]'
                                                : 'text-foreground border-transparent hover:bg-white/75 dark:hover:bg-slate-800/70 hover:border-primary-300/30 dark:hover:border-primary-500/20'
                                        }`}
                                        dir={dir}
                                    >
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${activeTab === tab.id ? 'bg-white/15' : 'bg-black/5 dark:bg-white/5'}`}>
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
