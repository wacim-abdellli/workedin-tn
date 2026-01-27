import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase,
    DollarSign,
    Clock,
    Star,
    TrendingUp,
    CheckCircle,
    Bell,
    Settings,
    User,
    Calendar,
    Zap,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';

// Mock data for demo
const MOCK_STATS = {
    jobsCompleted: 12,
    totalEarnings: 2450,
    avgResponseTime: 2.5,
    rating: 4.8,
    reviews: 8,
    profileCompletion: 85,
};

const MOCK_JOBS = [
    {
        id: 'j1',
        title: 'تصميم لوجو لمتجر إلكتروني',
        budget: 75,
        deadline: '2 أيام',
        skills: ['تصميم جرافيكي'],
        isNew: true,
        isUrgent: false,
        match_score: 95,
    },
    {
        id: 'j2',
        title: 'ترجمة وثائق قانونية',
        budget: 120,
        deadline: '5 أيام',
        skills: ['ترجمة'],
        isNew: true,
        isUrgent: false,
        match_score: 88,
    },
    {
        id: 'j3',
        title: 'تصميم منشورات سوشيال ميديا',
        budget: 40,
        deadline: 'يوم واحد',
        skills: ['تصميم جرافيكي', 'تسويق رقمي'],
        isNew: false,
        isUrgent: true,
        match_score: 92,
    },
];

const MOCK_ACTIVITY = [
    { id: 'a1', type: 'payment', message: 'استلمت 75 د.ت من "محمد العميل"', time: 'منذ 2 ساعة' },
    { id: 'a2', type: 'review', message: 'حصلت على تقييم 5 نجوم', time: 'منذ يوم' },
    { id: 'a3', type: 'match', message: 'تطابق جديد: تصميم هوية بصرية', time: 'منذ يومين' },
];

function FreelancerDashboardPage() {
    const { t } = useTranslation();
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const [filter, setFilter] = useState<'all' | 'new' | 'urgent'>('all');
    const [stats] = useState(MOCK_STATS);
    const [jobs] = useState(MOCK_JOBS);
    const [activity] = useState(MOCK_ACTIVITY);


    const filteredJobs = jobs.filter((job) => {
        if (filter === 'new') return job.isNew;
        if (filter === 'urgent') return job.isUrgent;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-8">
                {/* Welcome Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {t.dashboard.welcome}، {profile?.full_name || 'مستخدم'}!
                        </h1>
                        <p className="text-muted">لوحة تحكم الموظف الحر</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow relative">
                            <Bell className="w-5 h-5 text-muted" />
                            <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                3
                            </span>
                        </button>
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <Settings className="w-5 h-5 text-muted" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <Briefcase className="w-8 h-8 opacity-80" />
                            <TrendingUp className="w-5 h-5 opacity-60" />
                        </div>
                        <p className="text-3xl font-bold">{stats.jobsCompleted}</p>
                        <p className="text-primary-100 text-sm">{t.dashboard.jobsCompleted}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <DollarSign className="w-8 h-8 opacity-80" />
                            <TrendingUp className="w-5 h-5 opacity-60" />
                        </div>
                        <p className="text-3xl font-bold">{stats.totalEarnings}</p>
                        <p className="text-green-100 text-sm">{t.dashboard.totalEarnings}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-secondary-500 to-secondary-700 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <Clock className="w-8 h-8 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{stats.avgResponseTime}</p>
                        <p className="text-secondary-100 text-sm">{t.dashboard.responseTime}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <Star className="w-8 h-8 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{stats.rating}</p>
                        <p className="text-yellow-100 text-sm">{t.dashboard.rating} ({stats.reviews})</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Available Jobs - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground">
                                {t.dashboard.availableJobs}
                            </h2>
                            <div className="flex gap-2">
                                {(['all', 'new', 'urgent'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${filter === f
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-white text-muted hover:bg-gray-100'
                                            }
                    `}
                                    >
                                        {f === 'all' ? t.dashboard.all : f === 'new' ? t.dashboard.new : t.dashboard.urgent}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="card hover:shadow-lg transition-shadow cursor-pointer group"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {job.isNew && (
                                                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                                        جديد
                                                    </span>
                                                )}
                                                {job.isUrgent && (
                                                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        مستعجل
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-foreground group-hover:text-primary-600 transition-colors">
                                                {job.title}
                                            </h3>
                                        </div>
                                        <span className="badge-primary text-lg">
                                            {job.budget} د.ت
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-muted">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {job.deadline}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                {job.match_score}% تطابق
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {job.skills.slice(0, 2).map((skill, i) => (
                                                <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredJobs.length === 0 && (
                                <div className="card text-center py-12">
                                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-muted">لا توجد وظائف متاحة</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - 1/3 width */}
                    <div className="space-y-6">
                        {/* Profile Completion */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-foreground">
                                    {t.dashboard.profileCompletion}
                                </h3>
                                <span className="text-primary-600 font-bold">{stats.profileCompletion}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                    style={{ width: `${stats.profileCompletion}%` }}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => navigate('/settings/profile')}
                            >
                                {t.dashboard.updateProfile}
                            </Button>
                        </div>

                        {/* Recent Activity */}
                        <div className="card">
                            <h3 className="font-semibold text-foreground mb-4">
                                {t.dashboard.recentActivity}
                            </h3>
                            <div className="space-y-4">
                                {activity.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${item.type === 'payment' ? 'bg-green-100' :
                                                item.type === 'review' ? 'bg-yellow-100' : 'bg-blue-100'}
                    `}>
                                            {item.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                                            {item.type === 'review' && <Star className="w-4 h-4 text-yellow-600" />}
                                            {item.type === 'match' && <Briefcase className="w-4 h-4 text-blue-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground">{item.message}</p>
                                            <p className="text-xs text-muted">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card bg-gradient-to-br from-primary-50 to-secondary-50">
                            <h3 className="font-semibold text-foreground mb-4">إجراءات سريعة</h3>
                            <div className="space-y-3">
                                <Button
                                    variant="primary"
                                    size="md"
                                    className="w-full justify-start"
                                    leftIcon={<User className="w-5 h-5" />}
                                    onClick={() => navigate('/profile')}
                                >
                                    عرض البروفايل
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="md"
                                    className="w-full justify-start"
                                    leftIcon={<Briefcase className="w-5 h-5" />}
                                    onClick={() => navigate('/jobs')}
                                >
                                    تصفح الوظائف
                                </Button>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={signOut}
                            className="w-full text-center text-muted hover:text-red-600 py-2 text-sm transition-colors"
                        >
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FreelancerDashboardPage;
