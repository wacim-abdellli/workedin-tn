import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Grid,
    List,
    X,
    Briefcase,
    Award,
    Sparkles,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { SkeletonProfile, SkeletonList } from '../components/common';
import EmptyState from '../components/common/EmptyState';
import FreelancerCard from '../components/freelancers/FreelancerCard';
import { useTranslation } from '../i18n';

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
    const { t } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('recommended');
    const [showFilters, setShowFilters] = useState(false);
    const [savedFreelancers, setSavedFreelancers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate data fetching
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

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
                    placeholder={t.findFreelancers.searchPlaceholder}
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
                        <span className="font-medium text-dark-900 dark:text-white group-hover:text-primary-600 transition-colors">{t.findFreelancers.availableNow}</span>
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
                    {t.findFreelancers.category}
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
                    {t.findFreelancers.skills}
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
                <h3 className="font-bold text-dark-900 dark:text-white mb-4">{t.findFreelancers.hourlyRate}</h3>
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
                {t.findFreelancers.clearFilters}
            </Button>
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
                                <span>{t.findFreelancers.hero.badge}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-dark-900 dark:text-white mb-3">
                                {t.findFreelancers.hero.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">{t.findFreelancers.hero.titleHighlight}</span>
                            </h1>
                            <p className="text-lg text-muted max-w-xl">
                                {t.findFreelancers.hero.subtitle}
                                <span className="hidden md:inline">{t.findFreelancers.hero.subtitleDesktop}</span>
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
                            {t.findFreelancers.filterToggle}
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
                                    {t.findFreelancers.filterTitle}
                                </h3>
                                {(selectedCategories.length > 0 || selectedSkills.length > 0) && (
                                    <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                                        {t.findFreelancers.clearAll}
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
                                {t.findFreelancers.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted hidden sm:inline">{t.findFreelancers.sort.label}</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent border-none text-sm font-bold text-foreground focus:ring-0 cursor-pointer pr-8"
                                >
                                    <option value="recommended">{t.findFreelancers.sort.recommended}</option>
                                    <option value="rating">{t.findFreelancers.sort.rating}</option>
                                    <option value="rate_low">{t.findFreelancers.sort.priceLow}</option>
                                </select>
                            </div>
                        </div>

                        {isLoading ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[...Array(6)].map((_, i) => <SkeletonProfile key={i} />)}
                                </div>
                            ) : (
                                <SkeletonList count={6} />
                            )
                        ) : filteredFreelancers.length > 0 ? (
                            <div className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'space-y-4'
                            }>
                                {filteredFreelancers.map((freelancer, idx) => (
                                    <div key={freelancer.id} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <FreelancerCard
                                            freelancer={freelancer}
                                            viewMode={viewMode}
                                            isSaved={savedFreelancers.includes(freelancer.id)}
                                            onToggleSave={toggleSaved}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Search}
                                title={t.findFreelancers.noResults.title}
                                description={t.findFreelancers.noResults.description}
                                action={{
                                    label: t.findFreelancers.noResults.action,
                                    onClick: clearFilters,
                                    variant: "primary"
                                }}
                            />
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
                            <h3 className="font-bold text-xl text-foreground">{t.findFreelancers.filterTitle}</h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 -mr-2 text-gray-400 hover:text-dark-900 dark:hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <FilterSidebar />
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-950">
                            <Button className="w-full py-4 text-lg shadow-lg shadow-primary-500/20" onClick={() => setShowFilters(false)}>
                                {t.findFreelancers.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
