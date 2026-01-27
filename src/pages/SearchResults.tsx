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
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-8">
                {/* Search Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                defaultValue={query}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchParams({ q: (e.target as HTMLInputElement).value, type: activeTab });
                                    }
                                }}
                                placeholder="ابحث..."
                                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl text-lg"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? 'bg-primary-50 border-primary-200' : ''}
                        >
                            <Filter className="w-5 h-5 ml-2" />
                            فلترة
                        </Button>
                        <Button variant="ghost" onClick={() => setShowSaveModal(true)}>
                            <Bookmark className="w-5 h-5" />
                        </Button>
                    </div>

                    {query && (
                        <p className="text-muted">
                            نتائج البحث عن: <span className="font-medium text-foreground">"{query}"</span>
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="card mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold">فلترة متقدمة</h3>
                            <button onClick={() => setShowFilters(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">التصنيف</label>
                                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white">
                                    <option>الكل</option>
                                    <option>تصميم جرافيكي</option>
                                    <option>برمجة وتطوير</option>
                                    <option>كتابة وترجمة</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">الموقع</label>
                                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white">
                                    <option>الكل</option>
                                    <option>عن بعد</option>
                                    <option>تونس العاصمة</option>
                                    <option>صفاقس</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">الميزانية</label>
                                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white">
                                    <option>الكل</option>
                                    <option>أقل من 100 د.ت</option>
                                    <option>100-500 د.ت</option>
                                    <option>500+ د.ت</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">التقييم</label>
                                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white">
                                    <option>الكل</option>
                                    <option>4+ نجوم</option>
                                    <option>4.5+ نجوم</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <Button variant="primary" size="sm">تطبيق</Button>
                            <Button variant="ghost" size="sm">إعادة تعيين</Button>
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
                            className="card cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                    <Briefcase className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <span className="text-xs text-primary-600 font-medium">{job.category}</span>
                                            <h3 className="font-bold text-foreground mt-1">{job.title}</h3>
                                        </div>
                                        <span className="text-primary-600 font-bold whitespace-nowrap">{job.budget}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted">
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
                                            <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
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
                            className="card cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                                    {freelancer.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-foreground">{freelancer.name}</h3>
                                            <p className="text-muted">{freelancer.title}</p>
                                        </div>
                                        <span className="text-primary-600 font-bold whitespace-nowrap">{freelancer.hourlyRate} د.ت/س</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                                        <span className="flex items-center gap-1 text-yellow-600">
                                            <Star className="w-4 h-4 fill-yellow-500" />
                                            {freelancer.rating} ({freelancer.reviews})
                                        </span>
                                        <span className="flex items-center gap-1 text-muted">
                                            <MapPin className="w-4 h-4" />
                                            {freelancer.location}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {freelancer.skills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
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
                            <h3 className="font-bold mb-4">مهارات ذات صلة</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {['تصميم شعارات', 'تصميم UI/UX', 'برمجة React', 'ترجمة عربي-إنجليزي', 'تسويق رقمي'].map(skill => (
                                    <button
                                        key={skill}
                                        onClick={() => setSearchParams({ q: skill, type: 'all' })}
                                        className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-right transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Tag className="w-5 h-5 text-primary-600" />
                                            <span className="text-sm text-muted">150 نتيجة</span>
                                        </div>
                                        <p className="font-medium mt-2">{skill}</p>
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
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowSaveModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">حفظ البحث</h3>
                        <input
                            type="text"
                            value={savedSearchName}
                            onChange={(e) => setSavedSearchName(e.target.value)}
                            placeholder="اسم البحث المحفوظ"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4"
                        />
                        <div className="space-y-2 mb-4">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                                <input type="checkbox" className="w-4 h-4" />
                                <Bell className="w-5 h-5 text-gray-500" />
                                <span>إشعاري عند وجود نتائج جديدة</span>
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowSaveModal(false)}>
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
