import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    X,
    Clock,
    Briefcase,
    User,
    Tag,
    TrendingUp,
    ArrowRight,
    Command,
} from 'lucide-react';

interface SearchResult {
    id: string;
    type: 'job' | 'freelancer' | 'skill';
    title: string;
    subtitle?: string;
    avatar?: string;
    rating?: number;
    budget?: string;
}

// Mock search results
const MOCK_JOBS: SearchResult[] = [
    { id: 'j1', type: 'job', title: 'تصميم شعار احترافي', subtitle: 'تصميم جرافيكي', budget: '150-300 د.ت' },
    { id: 'j2', type: 'job', title: 'تطوير موقع تجارة إلكترونية', subtitle: 'برمجة وتطوير', budget: '1000-2000 د.ت' },
    { id: 'j3', type: 'job', title: 'ترجمة وثائق قانونية', subtitle: 'كتابة وترجمة', budget: '200-400 د.ت' },
];

const MOCK_FREELANCERS: SearchResult[] = [
    { id: 'f1', type: 'freelancer', title: 'أحمد بن علي', subtitle: 'مصمم جرافيكي', rating: 4.9 },
    { id: 'f2', type: 'freelancer', title: 'سارة المنصوري', subtitle: 'مطورة ويب', rating: 4.8 },
    { id: 'f3', type: 'freelancer', title: 'محمد الشريف', subtitle: 'مترجم محترف', rating: 4.7 },
];

const TRENDING_SEARCHES = [
    'تصميم شعار',
    'تطوير موقع',
    'ترجمة',
    'تسويق رقمي',
    'كتابة محتوى',
];

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([
        'تصميم',
        'مطور React',
        'ترجمة عربي انجليزي',
    ]);
    const [results, setResults] = useState<{
        jobs: SearchResult[];
        freelancers: SearchResult[];
        skills: string[];
    }>({ jobs: [], freelancers: [], skills: [] });
    const [isSearching, setIsSearching] = useState(false);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults({ jobs: [], freelancers: [], skills: [] });
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            // Simulate search
            const filteredJobs = MOCK_JOBS.filter(j =>
                j.title.includes(query) || j.subtitle?.includes(query)
            );
            const filteredFreelancers = MOCK_FREELANCERS.filter(f =>
                f.title.includes(query) || f.subtitle?.includes(query)
            );
            const skills = ['تصميم', 'برمجة', 'ترجمة', 'تسويق'].filter(s =>
                s.includes(query)
            );

            setResults({
                jobs: filteredJobs,
                freelancers: filteredFreelancers,
                skills,
            });
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        // Add to recent searches
        setRecentSearches(prev => {
            const filtered = prev.filter(s => s !== searchQuery);
            return [searchQuery, ...filtered].slice(0, 5);
        });

        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        onClose();
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
    };

    const hasResults = results.jobs.length > 0 || results.freelancers.length > 0 || results.skills.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Search Modal */}
            <div className="relative mx-auto mt-20 max-w-2xl px-4">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="ابحث عن وظائف، موظفين، مهارات..."
                            className="flex-1 bg-transparent outline-none text-lg"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        <kbd className="hidden md:flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
                            <span>ESC</span>
                        </kbd>
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {/* Loading */}
                        {isSearching && (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        )}

                        {/* Results */}
                        {!isSearching && hasResults && (
                            <div className="p-4 space-y-6">
                                {/* Jobs */}
                                {results.jobs.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                وظائف
                                            </h3>
                                            <button
                                                onClick={() => handleSearch(query)}
                                                className="text-sm text-primary-600 hover:text-primary-700"
                                            >
                                                عرض الكل
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {results.jobs.map(job => (
                                                <button
                                                    key={job.id}
                                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-right transition-colors"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-foreground truncate">{job.title}</p>
                                                        <p className="text-sm text-muted">{job.subtitle} • {job.budget}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Freelancers */}
                                {results.freelancers.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                موظفين حرين
                                            </h3>
                                            <button
                                                onClick={() => navigate(`/find-freelancers?q=${encodeURIComponent(query)}`)}
                                                className="text-sm text-primary-600 hover:text-primary-700"
                                            >
                                                عرض الكل
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {results.freelancers.map(freelancer => (
                                                <button
                                                    key={freelancer.id}
                                                    onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-right transition-colors"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
                                                        {freelancer.title.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-foreground truncate">{freelancer.title}</p>
                                                        <p className="text-sm text-muted">{freelancer.subtitle} • ⭐ {freelancer.rating}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Skills */}
                                {results.skills.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-3">
                                            <Tag className="w-4 h-4" />
                                            مهارات
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {results.skills.map(skill => (
                                                <button
                                                    key={skill}
                                                    onClick={() => handleSearch(`skill:${skill}`)}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No Query State */}
                        {!query && !isSearching && (
                            <div className="p-4 space-y-6">
                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                عمليات البحث الأخيرة
                                            </h3>
                                            <button
                                                onClick={clearRecentSearches}
                                                className="text-sm text-red-500 hover:text-red-600"
                                            >
                                                مسح
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {recentSearches.map((search, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSearch(search)}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-right transition-colors"
                                                >
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="flex-1">{search}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trending */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-3">
                                        <TrendingUp className="w-4 h-4" />
                                        عمليات بحث رائجة
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {TRENDING_SEARCHES.map((search, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSearch(search)}
                                                className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-full text-sm transition-colors"
                                            >
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {query && !isSearching && !hasResults && (
                            <div className="p-8 text-center">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">لا توجد نتائج لـ "{query}"</p>
                                <p className="text-sm text-muted mt-1">حاول استخدام كلمات مفتاحية مختلفة</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-100 text-xs text-muted">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</kbd>
                                للبحث
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">ESC</kbd>
                                للإغلاق
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Command className="w-3 h-3" />
                            <span>+ K</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
