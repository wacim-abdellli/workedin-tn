import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Briefcase,
    Tag,
    Star,
    MapPin,
    Clock,
    X,
    Bookmark,
    Bell,

} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

// Mock results
const MOCK_JOBS = [
    { id: 'j1', type: 'job', title: 'تصميم شعار احترافي لشركة ناشئة', category: 'تصميم جرافيكي', budget: '150-300 د.ت', location: 'عن بعد', skills: ['Illustrator', 'Photoshop'], postedAt: 'منذ 2 ساعة' },
    { id: 'j2', type: 'job', title: 'تطوير تطبيق موبايل React Native', category: 'برمجة وتطوير', budget: '2000-4000 د.ت', location: 'تونس', skills: ['React Native', 'TypeScript'], postedAt: 'منذ يوم' },
    { id: 'j3', type: 'job', title: 'ترجمة موقع إلكتروني عربي-إنجليزي', category: 'كتابة وترجمة', budget: '300-500 د.ت', location: 'عن بعد', skills: ['Translation', 'Arabic'], postedAt: 'منذ 3 أيام' },
];

const MOCK_FREELANCERS = [
    { id: 'f1', type: 'freelancer', name: 'أحمد بن علي', title: 'مصمم جرافيكي محترف', rating: 4.9, reviews: 45, hourlyRate: 35, location: 'تونس العاصمة', skills: ['Logo Design', 'UI/UX'], avatar: null },
    { id: 'f2', type: 'freelancer', name: 'سارة المنصوري', title: 'مطورة Full-Stack', rating: 4.8, reviews: 32, hourlyRate: 50, location: 'صفاقس', skills: ['React', 'Node.js'], avatar: null },
    { id: 'f3', type: 'freelancer', name: 'محمد الشريف', title: 'مترجم محترف معتمد', rating: 4.7, reviews: 28, hourlyRate: 25, location: 'سوسة', skills: ['Arabic', 'English', 'French'], avatar: null },
];

type Tab = 'all' | 'jobs' | 'freelancers' | 'skills';

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';
    const type = (searchParams.get('type') as Tab) || 'all';

    const [activeTab, setActiveTab] = useState<Tab>(type);
    const [showFilters, setShowFilters] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savedSearchName, setSavedSearchName] = useState('');

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'all', label: 'جميع النتائج', count: MOCK_JOBS.length + MOCK_FREELANCERS.length },
        { id: 'jobs', label: 'وظائف', count: MOCK_JOBS.length },
        { id: 'freelancers', label: 'موظفين حرين', count: MOCK_FREELANCERS.length },
        { id: 'skills', label: 'مهارات', count: 5 },
    ];

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ q: query, type: tab });
    };

    const handleSaveSearch = () => {
        // Would save to backend
        setShowSaveModal(false);
        setSavedSearchName('');
    };

    return (
        <div className="page-shell">
            <SEO {...SEO_CONFIG.search} url="/search" />
            <Header />

            <div className="page-shell-content">
                {/* Search Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                defaultValue={query}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchParams({ q: (e.target as HTMLInputElement).value, type: activeTab });
                                    }
                                }}
                                placeholder="ابحث..."
                                className="w-full pr-12 pl-4 py-3 border border-gray-200 dark:border-dark-700 rounded-xl text-lg bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400' : 'bg-white dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-dark-700 dark:text-dark-200'}
                        >
                            <Filter className="w-5 h-5 ml-2" />
                            فلترة
                        </Button>
                        <Button variant="ghost" onClick={() => setShowSaveModal(true)} className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 text-dark-700 dark:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-800">
                            <Bookmark className="w-5 h-5" />
                        </Button>
                    </div>

                    {query && (
                        <p className="text-gray-500 dark:text-gray-400">
                            نتائج البحث عن: <span className="font-medium text-dark-900 dark:text-white">"{query}"</span>
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors border ${activeTab === tab.id
                                ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-white dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="card mb-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-dark-900 dark:text-white">فلترة متقدمة</h3>
                            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-300">التصنيف</label>
                                <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all">
                                    <option>الكل</option>
                                    <option>تصميم جرافيكي</option>
                                    <option>برمجة وتطوير</option>
                                    <option>كتابة وترجمة</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-300">الموقع</label>
                                <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all">
                                    <option>الكل</option>
                                    <option>عن بعد</option>
                                    <option>تونس العاصمة</option>
                                    <option>صفاقس</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-300">الميزانية</label>
                                <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all">
                                    <option>الكل</option>
                                    <option>أقل من 100 د.ت</option>
                                    <option>100-500 د.ت</option>
                                    <option>500+ د.ت</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-300">التقييم</label>
                                <select className="w-full px-3 py-2 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all">
                                    <option>الكل</option>
                                    <option>4+ نجوم</option>
                                    <option>4.5+ نجوم</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <Button variant="primary" size="sm">تطبيق</Button>
                            <Button variant="ghost" size="sm" className="text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800">إعادة تعيين</Button>
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="space-y-4">
                    {/* Jobs */}
                    {(activeTab === 'all' || activeTab === 'jobs') && MOCK_JOBS.map(job => (
                        <div
                            key={job.id}
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            className="card cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Briefcase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{job.category}</span>
                                            <h3 className="font-bold text-dark-900 dark:text-white mt-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{job.title}</h3>
                                        </div>
                                        <span className="text-primary-600 dark:text-white font-bold whitespace-nowrap bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-lg text-sm">{job.budget}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {job.postedAt}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {job.skills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs border border-transparent dark:border-dark-700">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Freelancers */}
                    {(activeTab === 'all' || activeTab === 'freelancers') && MOCK_FREELANCERS.map(freelancer => (
                        <div
                            key={freelancer.id}
                            onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                            className="card cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-primary-500/20">
                                    {freelancer.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{freelancer.name}</h3>
                                            <p className="text-gray-500 dark:text-gray-400">{freelancer.title}</p>
                                        </div>
                                        <span className="text-primary-600 dark:text-primary-400 font-bold whitespace-nowrap">{freelancer.hourlyRate} د.ت/س</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                                        <span className="flex items-center gap-1 text-warning-600 dark:text-warning-400">
                                            <Star className="w-4 h-4 fill-current" />
                                            {freelancer.rating} ({freelancer.reviews})
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                            <MapPin className="w-4 h-4" />
                                            {freelancer.location}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {freelancer.skills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs border border-transparent dark:border-dark-700">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Skills Tab */}
                    {activeTab === 'skills' && (
                        <div className="card">
                            <h3 className="font-bold mb-4 text-dark-900 dark:text-white">مهارات ذات صلة</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {['تصميم شعارات', 'تصميم UI/UX', 'برمجة React', 'ترجمة عربي-إنجليزي', 'تسويق رقمي'].map(skill => (
                                    <button
                                        key={skill}
                                        onClick={() => setSearchParams({ q: skill, type: 'all' })}
                                        className="p-4 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl text-right transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Tag className="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">150 نتيجة</span>
                                        </div>
                                        <p className="font-medium mt-2 text-dark-900 dark:text-white">{skill}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Search Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
                    <div className="relative w-full max-w-md border border-gray-100 bg-white p-6 animate-scale-in radius-card elevation-2 dark:border-white/8 dark:bg-[#1a1825]">
                        <h3 className="text-xl font-bold mb-4 text-dark-900 dark:text-white">حفظ البحث</h3>
                        <input
                            type="text"
                            value={savedSearchName}
                            onChange={(e) => setSavedSearchName(e.target.value)}
                            placeholder="اسم البحث المحفوظ"
                            className="w-full px-4 py-3 border border-gray-200 dark:border-dark-700 rounded-xl mb-4 bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="space-y-2 mb-4">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 bg-white dark:bg-dark-900 border-gray-300 dark:border-dark-600" />
                                <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                <span className="text-dark-700 dark:text-gray-300">إشعاري عند وجود نتائج جديدة</span>
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800" onClick={() => setShowSaveModal(false)}>
                                إلغاء
                            </Button>
                            <Button variant="primary" className="flex-1" onClick={handleSaveSearch}>
                                حفظ
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
