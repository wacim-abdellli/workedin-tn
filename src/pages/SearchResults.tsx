import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Briefcase,
    User,
    Tag,
    Star,
    MapPin,
    Clock,
    X,
    Bookmark,
    Bell,
    AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { SkeletonCard } from '../components/common';
import { getJobs } from '../services/jobs';
import { getFreelancers } from '../services/profiles';
import { useTranslation } from '../i18n';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

type Tab = 'all' | 'jobs' | 'freelancers' | 'skills';

// Skill tags always shown (static suggestions)
const SKILL_SUGGESTIONS = [
    'تصميم شعارات', 'تصميم UI/UX', 'برمجة React',
    'ترجمة عربي-إنجليزي', 'تسويق رقمي', 'تطوير موبايل',
];

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const h = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return debounced;
}

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language } = useTranslation();

    const query = searchParams.get('q') || '';
    const typeParam = (searchParams.get('type') as Tab) || 'all';

    const [inputValue, setInputValue] = useState(query);
    const [activeTab, setActiveTab] = useState<Tab>(typeParam);
    const [showFilters, setShowFilters] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savedSearchName, setSavedSearchName] = useState('');

    const debouncedQuery = useDebounce(query, 300);

    const dateLocale = language === 'ar' ? ar : language === 'fr' ? fr : enUS;

    // Fetch jobs from Supabase
    const {
        data: jobsData,
        isLoading: jobsLoading,
        error: jobsError,
    } = useQuery({
        queryKey: ['search-jobs', debouncedQuery],
        queryFn: () => getJobs({ search: debouncedQuery || undefined }, 1, 12),
        enabled: (activeTab === 'all' || activeTab === 'jobs') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    // Fetch freelancers from Supabase
    const {
        data: freelancersData,
        isLoading: freelancersLoading,
        error: freelancersError,
    } = useQuery({
        queryKey: ['search-freelancers', debouncedQuery],
        queryFn: () => getFreelancers({ search: debouncedQuery || undefined }, 1, 12),
        enabled: (activeTab === 'all' || activeTab === 'freelancers') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const jobs = jobsData?.data ?? [];
    const freelancers = (freelancersData?.data ?? []) as Array<{
        id: string;
        full_name: string;
        avatar_url?: string;
        location?: string;
        freelancer_profiles?: {
            title?: string;
            hourly_rate?: number;
            skills?: string[];
            jobs_completed?: number;
        } | null;
    }>;
    const totalCount = jobs.length + freelancers.length;

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'all', label: 'جميع النتائج', count: totalCount },
        { id: 'jobs', label: 'وظائف', count: jobs.length },
        { id: 'freelancers', label: 'موظفون حرون', count: freelancers.length },
        { id: 'skills', label: 'مهارات', count: SKILL_SUGGESTIONS.length },
    ];

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ q: query, type: tab });
    };

    const handleSearch = (q: string) => {
        setSearchParams({ q, type: activeTab });
    };

    const handleSaveSearch = () => {
        setShowSaveModal(false);
        setSavedSearchName('');
    };

    const isLoading = jobsLoading || freelancersLoading;
    const hasError = jobsError || freelancersError;
    const hasResults = jobs.length > 0 || freelancers.length > 0;

    return (
        <div className="page-shell">
            <SEO {...SEO_CONFIG.search} url="/search" />
            <Header />

            <div className="page-shell-content">
                {/* Search Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(inputValue);
                                }}
                                placeholder="ابحث عن وظيفة أو موظف حر..."
                                className="input pe-4 ps-12 text-lg w-full"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? 'border-primary-400 text-[color:var(--workspace-primary)]' : ''}
                        >
                            <Filter className="w-5 h-5 me-2" />
                            فلترة
                        </Button>
                        <Button aria-label="حفظ البحث" variant="ghost" onClick={() => setShowSaveModal(true)}>
                            <Bookmark className="w-5 h-5" />
                        </Button>
                    </div>

                    {query && (
                        <p className="text-muted text-sm">
                            نتائج البحث عن: <span className="font-semibold text-foreground">"{query}"</span>
                            {!isLoading && hasResults && (
                                <span className="ms-2 text-muted">({totalCount} نتيجة)</span>
                            )}
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <div className="tabs-row mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={activeTab === tab.id ? 'tab-pill-active' : 'tab-pill'}
                        >
                            {tab.label}
                            {!isLoading && <span className="ms-1.5 text-xs opacity-60">({tab.count})</span>}
                        </button>
                    ))}
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="card mb-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-foreground">فلترة متقدمة</h3>
                            <button type="button" aria-label="إغلاق الفلاتر" onClick={() => setShowFilters(false)} className="p-1 hover:bg-secondary rounded-full transition-colors">
                                <X className="w-5 h-5 text-muted" />
                            </button>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="label">التصنيف</label>
                                <select className="form-control">
                                    <option>الكل</option>
                                    <option>تصميم جرافيكي</option>
                                    <option>برمجة وتطوير</option>
                                    <option>كتابة وترجمة</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">الموقع</label>
                                <select className="form-control">
                                    <option>الكل</option>
                                    <option>عن بعد</option>
                                    <option>تونس العاصمة</option>
                                    <option>صفاقس</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">الميزانية</label>
                                <select className="form-control">
                                    <option>الكل</option>
                                    <option>أقل من 100 د.ت</option>
                                    <option>100-500 د.ت</option>
                                    <option>500+ د.ت</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">التقييم</label>
                                <select className="form-control">
                                    <option>الكل</option>
                                    <option>4+ نجوم</option>
                                    <option>4.5+ نجوم</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty query prompt */}
                {!query && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-muted" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">ابدأ بحثك</h2>
                        <p className="text-muted mb-8">اكتب اسم الوظيفة أو المهارة أو اسم الموظف الحر</p>
                        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                            {SKILL_SUGGESTIONS.map(skill => (
                                <button
                                    key={skill}
                                    onClick={() => { setInputValue(skill); handleSearch(skill); }}
                                    className="px-3 py-1.5 rounded-full text-sm border border-border bg-card text-foreground hover:border-[color:var(--workspace-primary)] hover:text-[color:var(--workspace-primary)] transition-colors"
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error state */}
                {hasError && (
                    <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6 text-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-600 dark:text-red-400 font-medium">فشل تحميل النتائج. يرجى المحاولة مرة أخرى.</p>
                    </div>
                )}

                {/* Loading skeletons */}
                {isLoading && query && (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Results */}
                {!isLoading && query && (
                    <div className="space-y-4 cv-auto">
                        {/* Jobs */}
                        {(activeTab === 'all' || activeTab === 'jobs') && jobs.map(job => {
                            const postedAt = job.posted_at
                                ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true, locale: dateLocale })
                                : '';
                            const budgetStr = job.job_type === 'fixed_price'
                                ? `${job.budget_min ?? '?'} – ${job.budget_max ?? '?'} د.ت`
                                : `${job.hourly_rate ?? '?'} د.ت/س`;
                            const skills: string[] = Array.isArray(job.required_skills)
                                ? job.required_skills.map((s: unknown) => typeof s === 'string' ? s : (s as { name_en?: string }).name_en ?? '')
                                : [];

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                    className="card cursor-pointer group"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/jobs/${job.id}`); }
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Briefcase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <span className="text-xs text-[color:var(--workspace-primary)] font-medium">{job.category}</span>
                                                    <h3 className="font-bold text-foreground mt-1 group-hover:text-[color:var(--workspace-primary)] transition-colors">{job.title}</h3>
                                                </div>
                                                <span className="text-[color:var(--workspace-primary)] font-bold whitespace-nowrap bg-[color:var(--workspace-primary)]/8 px-2 py-1 rounded-lg text-sm shrink-0">
                                                    {budgetStr}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted">
                                                {job.client?.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {job.client.location}
                                                    </span>
                                                )}
                                                {postedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {postedAt}
                                                    </span>
                                                )}
                                            </div>
                                            {skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {skills.slice(0, 4).map((skill, i) => (
                                                        <span key={i} className="px-2 py-1 bg-secondary text-foreground rounded-lg text-xs border border-border">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Freelancers */}
                        {(activeTab === 'all' || activeTab === 'freelancers') && freelancers.map(freelancer => {
                            const fp = freelancer.freelancer_profiles;
                            const skills: string[] = Array.isArray(fp?.skills) ? fp!.skills.map((s: unknown) => typeof s === 'string' ? s : (s as { name_en?: string }).name_en ?? '') : [];
                            const initials = freelancer.full_name?.charAt(0)?.toUpperCase() ?? '?';

                            return (
                                <div
                                    key={freelancer.id}
                                    onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                                    className="card cursor-pointer group"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/freelancer/${freelancer.id}`); }
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        {freelancer.avatar_url ? (
                                            <img
                                                src={freelancer.avatar_url}
                                                alt={freelancer.full_name}
                                                className="w-14 h-14 rounded-full object-cover shrink-0 shadow-md"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg">
                                                {initials}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="font-bold text-foreground group-hover:text-[color:var(--workspace-primary)] transition-colors">{freelancer.full_name}</h3>
                                                    {fp?.title && <p className="text-muted text-sm">{fp.title}</p>}
                                                </div>
                                                {fp?.hourly_rate && (
                                                    <span className="text-[color:var(--workspace-primary)] font-bold whitespace-nowrap shrink-0">
                                                        {fp.hourly_rate} د.ت/س
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted">
                                                {fp?.jobs_completed !== undefined && fp.jobs_completed > 0 && (
                                                    <span className="flex items-center gap-1 text-amber-500">
                                                        <Star className="w-4 h-4 fill-current" />
                                                        {fp.jobs_completed} مشروع منجز
                                                    </span>
                                                )}
                                                {freelancer.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {freelancer.location}
                                                    </span>
                                                )}
                                            </div>
                                            {skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {skills.slice(0, 4).map((skill, i) => (
                                                        <span key={i} className="px-2 py-1 bg-secondary text-foreground rounded-lg text-xs border border-border">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* No results */}
                        {!isLoading && !hasError && !hasResults && query && (
                            <div className="text-center py-16 card">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4">
                                    <User className="w-8 h-8 text-muted" />
                                </div>
                                <h3 className="font-bold text-foreground mb-1">لا توجد نتائج</h3>
                                <p className="text-muted text-sm mb-4">لم نجد وظائف أو موظفين حرين يطابقون "{query}"</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {SKILL_SUGGESTIONS.slice(0, 4).map(skill => (
                                        <button
                                            key={skill}
                                            onClick={() => { setInputValue(skill); handleSearch(skill); }}
                                            className="px-3 py-1.5 rounded-full text-sm border border-border bg-card text-foreground hover:border-[color:var(--workspace-primary)] hover:text-[color:var(--workspace-primary)] transition-colors"
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills tab */}
                        {activeTab === 'skills' && (
                            <div className="card">
                                <h3 className="font-bold mb-4 text-foreground">مهارات ذات صلة</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {SKILL_SUGGESTIONS.map(skill => (
                                        <button
                                            key={skill}
                                            onClick={() => { setInputValue(skill); handleSearch(skill); handleTabChange('all'); }}
                                            className="p-4 bg-secondary hover:bg-[color:var(--workspace-primary)]/8 rounded-xl text-start transition-colors group border border-border hover:border-[color:var(--workspace-primary)]/30"
                                        >
                                            <div className="flex items-center justify-between">
                                                <Tag className="w-5 h-5 text-[color:var(--workspace-primary)] group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="font-medium mt-2 text-foreground">{skill}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Search Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label="إغلاق نافذة حفظ البحث" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
                    <div className="relative w-full max-w-md card">
                        <h3 className="text-xl font-bold mb-4 text-foreground">حفظ البحث</h3>
                        <input
                            type="text"
                            value={savedSearchName}
                            onChange={(e) => setSavedSearchName(e.target.value)}
                            placeholder="اسم البحث المحفوظ"
                            className="input mb-4 w-full"
                        />
                        <div className="space-y-2 mb-4">
                            <label className="flex items-center gap-3 p-3 bg-secondary rounded-xl cursor-pointer hover:bg-[color:var(--workspace-primary)]/5 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-border" />
                                <Bell className="w-5 h-5 text-muted" />
                                <span className="text-foreground text-sm">إشعاري عند وجود نتائج جديدة</span>
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowSaveModal(false)}>إلغاء</Button>
                            <Button variant="primary" className="flex-1" onClick={handleSaveSearch}>حفظ</Button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
