import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Star,
    MapPin,
    Clock,
    Heart,
    Grid,
    List,
    X,
    Briefcase,
    Award,
    Sparkles,
    Shield
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

// Mock freelancers (Reduced for brevity in example, imagine full list)
const MOCK_FREELANCERS = [
    {
        id: 'f1',
        name: 'أحمد بن علي',
        title: 'مصمم جرافيكي محترف',
        avatar: null,
        rating: 4.9,
        reviews: 24,
        hourly_rate: 25,
        location: 'تونس العاصمة',
        skills: ['تصميم جرافيكي', 'لوجو', 'هوية بصرية'],
        success_rate: 98,
        jobs_completed: 32,
        response_time: '< 1 ساعة',
        is_verified: true,
        is_available: true,
    },
    {
        id: 'f2',
        name: 'سارة المنصوري',
        title: 'مترجمة محترفة',
        avatar: null,
        rating: 5.0,
        reviews: 18,
        hourly_rate: 20,
        location: 'صفاقس',
        skills: ['ترجمة', 'كتابة محتوى', 'تدقيق لغوي'],
        success_rate: 100,
        jobs_completed: 45,
        response_time: '< 2 ساعة',
        is_verified: true,
        is_available: true,
    },
    // ... duplicates for grid demo
    {
        id: 'f3',
        name: 'محمد الشريف',
        title: 'مطور ويب Full Stack',
        avatar: null,
        rating: 4.7,
        reviews: 12,
        hourly_rate: 35,
        location: 'سوسة',
        skills: ['React', 'Node.js', 'TypeScript'],
        success_rate: 95,
        jobs_completed: 28,
        response_time: '< 3 ساعة',
        is_verified: true,
        is_available: false,
    },
    {
        id: 'f4',
        name: 'فاطمة الزهراء',
        title: 'كاتبة محتوى إبداعي',
        avatar: null,
        rating: 4.8,
        reviews: 31,
        hourly_rate: 15,
        location: 'نابل',
        skills: ['كتابة محتوى', 'تسويق رقمي', 'سوشيال ميديا'],
        success_rate: 97,
        jobs_completed: 56,
        response_time: '< 1 ساعة',
        is_verified: false,
        is_available: true,
    },
];

const CATEGORIES = [
    'تصميم جرافيكي',
    'برمجة وتطوير',
    'كتابة وترجمة',
    'تسويق رقمي',
    'فيديو وصوت',
    'استشارات',
];

const SKILLS = [
    'React', 'Node.js', 'تصميم لوجو', 'ترجمة', 'كتابة محتوى',
    'Figma', 'تصوير', 'مونتاج', 'SEO', 'سوشيال ميديا',
];

export default function FindFreelancers() {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('recommended');
    const [showFilters, setShowFilters] = useState(false);
    const [savedFreelancers, setSavedFreelancers] = useState<string[]>([]);

    // Filter states
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [rateRange, setRateRange] = useState<[number, number]>([0, 100]);
    const [availableOnly, setAvailableOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);

    const toggleSaved = (id: string) => {
        setSavedFreelancers(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedSkills([]);
        setMinRating(0);
        setRateRange([0, 100]);
        setAvailableOnly(false);
        setVerifiedOnly(false);
    };

    const filteredFreelancers = MOCK_FREELANCERS.filter(f => {
        if (searchQuery && !f.name.includes(searchQuery) && !f.title.includes(searchQuery)) return false;
        if (minRating && f.rating < minRating) return false;
        if (f.hourly_rate < rateRange[0] || f.hourly_rate > rateRange[1]) return false;
        if (availableOnly && !f.is_available) return false;
        if (verifiedOnly && !f.is_verified) return false;
        if (selectedSkills.length > 0 && !selectedSkills.some(s => f.skills.includes(s))) return false;
        return true;
    });

    const FilterSidebar = () => (
        <div className="space-y-8">
            {/* Search */}
            <div className="relative group">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن موظفين..."
                    className="block w-full p-4 pr-10 text-sm text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:border-dark-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 transition-all shadow-sm focus:shadow-md"
                />
            </div>

            {/* Availability Toggle - Prominent */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white dark:from-dark-800 dark:to-dark-700 border border-primary-100 dark:border-dark-600 shadow-sm">
                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${availableOnly ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${availableOnly ? 'translate-x-full' : ''}`} />
                        </div>
                        <span className="font-medium text-dark-900 dark:text-white group-hover:text-primary-600 transition-colors">متاح الآن للعمل</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={availableOnly}
                        onChange={(e) => setAvailableOnly(e.target.checked)}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Categories */}
            <div>
                <h3 className="font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary-500" />
                    التصنيف
                </h3>
                <div className="space-y-2">
                    {CATEGORIES.map(cat => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-dark-800/50 rounded-lg transition-colors">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(cat)}
                                    onChange={() => setSelectedCategories(prev =>
                                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                    )}
                                    className="peer h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-700 dark:ring-offset-gray-800"
                                />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-dark-900 dark:group-hover:text-white transition-colors">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Skills - Tags Style */}
            <div>
                <h3 className="font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent-500" />
                    المهارات
                </h3>
                <div className="flex flex-wrap gap-2">
                    {SKILLS.slice(0, 8).map(skill => (
                        <button
                            key={skill}
                            onClick={() => setSelectedSkills(prev =>
                                prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                            )}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all transform active:scale-95 ${selectedSkills.includes(skill)
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                                : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-700 hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600'
                                }`}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <h3 className="font-bold text-dark-900 dark:text-white mb-4">السعر بالساعة (د.ت)</h3>
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
                    <input
                        type="number"
                        value={rateRange[0]}
                        onChange={(e) => setRateRange([Number(e.target.value), rateRange[1]])}
                        className="w-full bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-lg px-2 py-1 text-center text-sm"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                        type="number"
                        value={rateRange[1]}
                        onChange={(e) => setRateRange([rateRange[0], Number(e.target.value)])}
                        className="w-full bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-lg px-2 py-1 text-center text-sm"
                    />
                </div>
            </div>

            <Button variant="outline" className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 dark:border-red-900/30 dark:hover:bg-red-900/10 transition-colors" onClick={clearFilters}>
                مسح جميع الفلاتر
            </Button>
        </div>
    );

    const FreelancerCard = ({ freelancer }: { freelancer: typeof MOCK_FREELANCERS[0] }) => (
        <div
            className={`
                group relative bg-white dark:bg-dark-900 rounded-2xl 
                border border-gray-100 dark:border-dark-700 
                hover:border-primary-500/30 dark:hover:border-primary-500/30
                shadow-sm hover:shadow-xl hover:shadow-primary-500/10
                transition-all duration-300 ease-out transform hover:-translate-y-1
                cursor-pointer overflow-hidden
                ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-6 p-6' : 'p-6 flex flex-col'}
            `}
            onClick={() => navigate(`/freelancer/${freelancer.id}`)}
        >
            {/* Top Shine Effect */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Avatar Section */}
            <div className={`${viewMode === 'list' ? 'shrink-0 md:w-48 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-gray-100 dark:border-dark-700 pb-4 md:pb-0 md:pl-6' : 'mb-6 text-center'}`}>
                <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-2xl rotate-3 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/20 absolute inset-0 transition-transform group-hover:rotate-6" />
                    <div className={`
                        relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 
                        flex items-center justify-center text-white text-3xl font-bold font-cairo shadow-lg shadow-primary-500/20
                        group-hover:scale-105 transition-transform duration-300
                    `}>
                        {freelancer.name.charAt(0)}
                        {freelancer.is_available && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-dark-900 rounded-full" title="متاح للعمل" />
                        )}
                    </div>
                </div>

                {viewMode === 'list' && (
                    <div className="mt-4 text-center">
                        <div className="font-bold text-xl text-primary-600 dark:text-primary-400">
                            {freelancer.hourly_rate} <span className="text-sm text-muted font-normal">د.ت/ساعة</span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full inline-block">
                            {freelancer.success_rate}% نسبة نجاح
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                    <div className={viewMode === 'list' ? '' : 'text-center w-full'}>
                        <h3 className="text-lg font-bold text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-2 justify-center lg:justify-start">
                            {freelancer.name}
                            {freelancer.is_verified && (
                                <div className="tooltip" data-tip="هوية موثقة">
                                    <Shield className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                                </div>
                            )}
                        </h3>
                        <p className="text-sm text-muted font-medium mt-1">{freelancer.title}</p>
                    </div>
                    {viewMode !== 'list' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleSaved(freelancer.id); }}
                            className="absolute top-4 left-4 p-2 text-gray-300 hover:text-red-500 dark:text-dark-600 transition-colors"
                        >
                            <Heart className={`w-5 h-5 ${savedFreelancers.includes(freelancer.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                    )}
                </div>

                {/* Rating & Location */}
                <div className={`flex items-center gap-4 text-sm mb-4 ${viewMode === 'list' ? '' : 'justify-center border-b border-gray-50 dark:border-dark-800 pb-4'}`}>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-yellow-700 dark:text-yellow-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold">{freelancer.rating}</span>
                        <span className="text-yellow-600/60 dark:text-yellow-500/60 text-xs">({freelancer.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted">
                        <MapPin className="w-3.5 h-3.5" />
                        {freelancer.location}
                    </div>
                </div>

                {/* Stats Grid (Grid View) */}
                {viewMode !== 'list' && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2 bg-gray-50 dark:bg-dark-800 rounded-xl text-center">
                            <div className="text-lg font-bold text-primary-600 dark:text-primary-400">{freelancer.hourly_rate} د.ت</div>
                            <div className="text-[10px] text-muted">السعر / ساعة</div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-dark-800 rounded-xl text-center">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">{freelancer.success_rate}%</div>
                            <div className="text-[10px] text-muted">نسبة النجاح</div>
                        </div>
                    </div>
                )}

                {/* Skills */}
                <div className={`flex flex-wrap gap-1.5 ${viewMode === 'list' ? 'mb-4' : 'justify-center'}`}>
                    {freelancer.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-colors">
                            {skill}
                        </span>
                    ))}
                    {freelancer.skills.length > 3 && (
                        <span className="px-2 py-1 text-xs text-muted">+ {freelancer.skills.length - 3}</span>
                    )}
                </div>

                {/* Footer (List View: Actions) */}
                {viewMode === 'list' && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-700 mt-auto">
                        <div className="flex items-center gap-6 text-sm text-muted">
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {freelancer.jobs_completed} مشروع مكتمل
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                رد خلال {freelancer.response_time}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleSaved(freelancer.id); }}
                                className={`p-2.5 rounded-xl border transition-colors ${savedFreelancers.includes(freelancer.id)
                                    ? 'border-red-200 bg-red-50 text-red-500'
                                    : 'border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-dark-600 dark:text-gray-400'}`}
                            >
                                <Heart className={`w-5 h-5 ${savedFreelancers.includes(freelancer.id) ? 'fill-current' : ''}`} />
                            </button>
                            <Button size="sm" onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/freelancer/${freelancer.id}`);
                            }}>
                                عرض الملف الشخصي
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black transition-colors duration-300 font-arabic">
            <SEO {...SEO_CONFIG.findFreelancers} url="/find-freelancers" />
            <Header />

            {/* Page Title & Hero */}
            <div className="relative bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800 pt-12 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
                <div className="container-custom relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-bold mb-4 border border-primary-100 dark:border-primary-800">
                                <Sparkles className="w-3 h-3" />
                                <span>نخبة الكفاءات التونسية</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-dark-900 dark:text-white mb-3">
                                اكتشف <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">أفضل المواهب</span>
                            </h1>
                            <p className="text-lg text-muted max-w-xl">
                                تصفح آلاف المبدعين المستعدين للعمل على مشروعك القادم.
                                <span className="hidden md:inline"> ابحث بالمهارة، السعر، أو التقييم.</span>
                            </p>
                        </div>

                        {/* Global Actions */}
                        <div className="flex items-center gap-3 bg-white dark:bg-dark-800 p-1.5 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'grid'
                                    ? 'bg-primary-50 text-primary-600 shadow-sm dark:bg-primary-900/30 dark:text-primary-400'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-gray-200 dark:bg-dark-700" />
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'list'
                                    ? 'bg-primary-50 text-primary-600 shadow-sm dark:bg-primary-900/30 dark:text-primary-400'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-10">
                {/* Mobile Filter Toggle Button */}
                <div className="lg:hidden mb-6">
                    <Button
                        onClick={() => setShowFilters(true)}
                        className="w-full justify-between bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 shadow-sm h-12"
                    >
                        <span className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            تصفية النتائج
                        </span>
                        <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {filteredFreelancers.length}
                        </span>
                    </Button>
                </div>

                <div className="flex gap-10 items-start">
                    {/* Filter Sidebar - Desktop (Sticky) */}
                    <div className="hidden lg:block w-80 shrink-0 sticky top-28">
                        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-lg shadow-gray-200/50 dark:shadow-none p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-primary-500" />
                                    تصفية البحث
                                </h3>
                                {(selectedCategories.length > 0 || selectedSkills.length > 0) && (
                                    <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                                        مسح الكل
                                    </button>
                                )}
                            </div>
                            <FilterSidebar />
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Sort Options Helper */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-muted">
                                عرض <span className="font-bold text-foreground">{filteredFreelancers.length}</span> نتيجة
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted hidden sm:inline">ترتيب حسب:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent border-none text-sm font-bold text-foreground focus:ring-0 cursor-pointer pr-8"
                                >
                                    <option value="recommended">الأكثر توافقاً</option>
                                    <option value="rating">الأعلى تقييماً</option>
                                    <option value="rate_low">الأقل سعراً</option>
                                </select>
                            </div>
                        </div>

                        {filteredFreelancers.length > 0 ? (
                            <div className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'space-y-4'
                            }>
                                {filteredFreelancers.map((freelancer, idx) => (
                                    <div key={freelancer.id} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <FreelancerCard freelancer={freelancer} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="w-32 h-32 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Search className="w-12 h-12 text-gray-300 dark:text-dark-600" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">لا توجد نتائج مطابقة</h3>
                                <p className="text-muted max-w-sm mx-auto mb-8">لم نتمكن من العثور على موظفين بالمواصفات المطلوبة. جرب تغيير كلمات البحث أو تخفيف الفلاتر.</p>
                                <Button variant="primary" onClick={clearFilters}>
                                    مسح جميع الفلاتر
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal (Using new Premium Modal styling implicitly via portal if we refactored, but here simple fixed div for now or component) */}
            {showFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowFilters(false)} />
                    <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-dark-900 p-0 shadow-2xl animate-slide-in-right flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex items-center justify-between bg-white/90 dark:bg-dark-900/90 backdrop-blur z-10">
                            <h3 className="font-bold text-xl text-foreground">الفلاتر</h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 -mr-2 text-gray-400 hover:text-dark-900 dark:hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <FilterSidebar />
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-950">
                            <Button className="w-full py-4 text-lg shadow-lg shadow-primary-500/20" onClick={() => setShowFilters(false)}>
                                عرض {filteredFreelancers.length} نتيجة
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
