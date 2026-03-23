import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase,
    DollarSign,
    Clock,
    Users,
    Plus,
    Bell,
    Settings,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    User,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/common';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

// Mock data for demo
const MOCK_STATS = {
    activeJobs: 2,
    totalSpent: 450,
    contractsCompleted: 5,
    avgResponseDays: 1,
};

const MOCK_JOBS = [
    {
        id: 'j1',
        title: 'تصميم لوجو لمطعم تونسي',
        budget: 50,
        status: 'matched',
        matchCount: 3,
        created_at: 'منذ 2 ساعة',
    },
    {
        id: 'j2',
        title: 'ترجمة موقع إلكتروني',
        budget: 200,
        status: 'in_progress',
        freelancer: 'سارة المنصوري',
        progress: 60,
        created_at: 'منذ 3 أيام',
    },
    {
        id: 'j3',
        title: 'كتابة محتوى تسويقي',
        budget: 80,
        status: 'completed',
        freelancer: 'أحمد بن علي',
        rating: 5,
        created_at: 'منذ أسبوع',
    },
];

function ClientDashboardPage() {
    const { t, dir } = useTranslation();
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const [stats] = useState(MOCK_STATS);
    const [jobs] = useState(MOCK_JOBS);
    const [isLoading, setIsLoading] = useState(true);

    useState(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    });

    const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return (
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        مفتوح
                    </span>
                );
            case 'matched':
                return (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        تم المطابقة
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        قيد التنفيذ
                    </span>
                );
            case 'completed':
                return (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        مكتمل
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        ملغي
                    </span>
                );
            default:
                return null;
        }
    };

    const handleJobClick = (job: typeof MOCK_JOBS[0]) => {
        if (job.status === 'matched') {
            navigate(`/jobs/${job.id}/matches`);
        } else if (job.status === 'in_progress') {
            navigate(`/contracts/${job.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <div className="container-custom py-8">
                {/* Welcome Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {t.dashboard.welcome}، {profile?.full_name || 'عميل'}!
                        </h1>
                        <p className="text-muted">{t.dashboard.clientSubtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm hover:shadow-md transition-shadow relative">
                            <Bell className="w-5 h-5 text-muted" />
                        </button>
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <Settings className="w-5 h-5 text-muted" />
                        </button>
                    </div>
                </div>

                {/* Post New Job CTA */}
                <div
                    className="card bg-gradient-to-r from-secondary-600 to-secondary-800 text-white mb-8 cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => navigate('/jobs/new')}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-1">{t.dashboard.postNewJob}</h2>
                                <p className="text-secondary-100">
                                    {t.dashboard.postNewJobDesc}
                                </p>
                            </div>
                        </div>
                        <ArrowIcon className="w-8 h-8" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="card h-24 flex flex-col justify-center">
                                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                                <Skeleton className="w-8 h-8 mb-1" />
                                <Skeleton className="w-20 h-4" />
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="card">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-primary-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
                                <p className="text-sm text-muted">مهام نشطة</p>
                            </div>

                            <div className="card">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stats.totalSpent}</p>
                                <p className="text-sm text-muted">د.ت إجمالي الإنفاق</p>
                            </div>

                            <div className="card">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-secondary-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stats.contractsCompleted}</p>
                                <p className="text-sm text-muted">عقود مكتملة</p>
                            </div>

                            <div className="card">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stats.avgResponseDays}</p>
                                <p className="text-sm text-muted">يوم متوسط الاستجابة</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Jobs List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">{t.dashboard.yourJobs}</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/jobs')}
                        >
                            عرض الكل
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
                        ) : (
                            <>
                                {jobs.map((job) => (
                                    <div
                                        key={job.id}
                                        className="card hover:shadow-lg transition-shadow cursor-pointer group"
                                        onClick={() => handleJobClick(job)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-foreground group-hover:text-primary-600 transition-colors">
                                                        {job.title}
                                                    </h3>
                                                    {getStatusBadge(job.status)}
                                                </div>
                                                <p className="text-sm text-muted">{job.created_at}</p>
                                            </div>
                                            <span className="text-lg font-bold text-primary-600">
                                                {job.budget} د.ت
                                            </span>
                                        </div>

                                        {/* Status-specific content */}
                                        {job.status === 'matched' && (
                                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-yellow-600" />
                                                    <span className="text-yellow-800 font-medium">
                                                        {job.matchCount} موظفين متاحين
                                                    </span>
                                                </div>
                                                <Button variant="secondary" size="sm">
                                                    عرض المطابقات
                                                </Button>
                                            </div>
                                        )}

                                        {job.status === 'in_progress' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted" />
                                                        <span className="text-foreground">{job.freelancer}</span>
                                                    </div>
                                                    <span className="text-primary-600 font-medium">{job.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                                        style={{ width: `${job.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {job.status === 'completed' && (
                                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-5 h-5 text-green-600" />
                                                    <span className="text-green-800">{job.freelancer}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(job.rating)].map((_, i) => (
                                                        <span key={i} className="text-yellow-500">★</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {jobs.length === 0 && (
                                    <div className="card text-center py-12">
                                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-muted mb-4">لم تنشر أي مهام بعد</p>
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate('/jobs/new')}
                                        >
                                            نشر مهمة جديدة
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Logout */}
                <div className="mt-8 text-center">
                    <button
                        onClick={signOut}
                        className="text-muted hover:text-red-600 py-2 text-sm transition-colors"
                    >
                        {t.nav.logout}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ClientDashboardPage;
