import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Briefcase, Filter, Grid, List, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';

import SEO, { SEO_CONFIG } from '../components/common/SEO';
import EmptyState from '../components/common/EmptyState';
import { SkeletonList, SkeletonProfile } from '../components/common';
import FreelancerCard from '../components/freelancers/FreelancerCard';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { useTranslation } from '../i18n';
import * as profilesService from '../services/profiles';

type FreelancerCategory =
    | 'Design'
    | 'Development'
    | 'Writing'
    | 'Marketing'
    | 'Video'
    | 'Consulting';

type FreelancerRecord = {
    id: string;
    category: FreelancerCategory;
    name: string;
    title: string;
    avatar: string | null;
    rating: number;
    reviews: number;
    hourly_rate: number;
    location: string;
    skills: string[];
    success_rate: number;
    jobs_completed: number;
    response_time: string;
    is_verified: boolean;
    is_available: boolean;
};

const CATEGORY_OPTIONS: FreelancerCategory[] = ['Design', 'Development', 'Writing', 'Marketing', 'Video', 'Consulting'];
const SKILL_OPTIONS = ['React', 'Node.js', 'Logo Design', 'Translation', 'Content Writing', 'Figma', 'Motion', 'SEO'];

export default function FindFreelancers() {
    const { t } = useTranslation();
    const copy = t.findFreelancers;

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('recommended');
    const [showFilters, setShowFilters] = useState(false);
    const [savedFreelancers, setSavedFreelancers] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<FreelancerCategory[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [rateRange, setRateRange] = useState<[number, number]>([0, 100]);
    const [availableOnly, setAvailableOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);

    // Fetch real freelancers from DB
    const { data: freelancersData, isLoading } = useQuery({
        queryKey: ['freelancers', searchQuery],
        queryFn: async () => {
            const { data, error } = await profilesService.getFreelancers({ search: searchQuery || undefined });
            if (error) { console.error('getFreelancers error:', error); return []; }
            return (data || []).map((p: any) => {
                const fp = p.freelancer_profiles;
                const skills: string[] = Array.isArray(fp?.skills)
                    ? fp.skills.map((s: any) => (typeof s === 'string' ? s : s?.name || '')).filter(Boolean)
                    : [];
                return {
                    id: p.id,
                    category: 'Development' as FreelancerCategory,
                    name: p.full_name || 'Freelancer',
                    title: fp?.title || '',
                    avatar: p.avatar_url || null,
                    rating: 5.0,
                    reviews: 0,
                    hourly_rate: fp?.hourly_rate || 0,
                    location: p.location || '',
                    skills,
                    success_rate: fp?.success_rate || 100,
                    jobs_completed: fp?.jobs_completed || 0,
                    response_time: '< 1 hour',
                    is_verified: fp?.cin_verified || false,
                    is_available: fp?.availability === 'available',
                } as FreelancerRecord;
            });
        },
        staleTime: 60_000,
    });

    const toggleSaved = (id: string) => {
        setSavedFreelancers((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedSkills([]);
        setMinRating(0);
        setRateRange([0, 100]);
        setAvailableOnly(false);
        setVerifiedOnly(false);
        setSearchQuery('');
    };

    const filteredFreelancers = useMemo(() => {
        return [...(freelancersData || [])]
            .filter((freelancer) => {
                if (selectedCategories.length > 0 && !selectedCategories.includes(freelancer.category)) return false;
                if (selectedSkills.length > 0 && !selectedSkills.some((skill) => freelancer.skills.includes(skill))) return false;
                if (minRating > 0 && freelancer.rating < minRating) return false;
                if (freelancer.hourly_rate < rateRange[0] || freelancer.hourly_rate > rateRange[1]) return false;
                if (availableOnly && !freelancer.is_available) return false;
                if (verifiedOnly && !freelancer.is_verified) return false;
                return true;
            })
            .sort((left, right) => {
                switch (sortBy) {
                    case 'rating': return right.rating - left.rating;
                    case 'rate_low': return left.hourly_rate - right.hourly_rate;
                    default: return right.success_rate - left.success_rate;
                }
            });
    }, [freelancersData, availableOnly, minRating, rateRange, selectedCategories, selectedSkills, sortBy, verifiedOnly]);

    const activeFilterCount =
        selectedCategories.length +
        selectedSkills.length +
        (availableOnly ? 1 : 0) +
        (verifiedOnly ? 1 : 0) +
        (minRating > 0 ? 1 : 0) +
        (rateRange[0] > 0 || rateRange[1] < 100 ? 1 : 0);

    const averageRate = filteredFreelancers.length
        ? Math.round(filteredFreelancers.reduce((sum, freelancer) => sum + freelancer.hourly_rate, 0) / filteredFreelancers.length)
        : 0;

    const topRating = filteredFreelancers.length
        ? Math.max(...filteredFreelancers.map((freelancer) => freelancer.rating)).toFixed(1)
        : '0.0';

    const FilterSidebar = () => (
        <div className="space-y-8">
            <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Search className="h-5 w-5 text-[#8a839f] transition-colors group-focus-within:text-primary-500" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="block w-full rounded-2xl border border-white/70 bg-white/85 p-4 pr-11 text-sm text-[#191627] shadow-sm backdrop-blur transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-white/8 dark:bg-white/5 dark:text-white dark:focus:ring-primary-500/20"
                />
            </div>

            <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-500/10 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.03))]">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                        <div className="font-semibold text-[#191627] dark:text-white">{copy.availableNow}</div>
                        <div className="mt-1 text-sm text-[#6e6884] dark:text-[#9a95ad]">{copy.availableNowDesc}</div>
                    </div>
                    <div className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${availableOnly ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/10'}`}>
                        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${availableOnly ? 'translate-x-5' : ''}`} />
                    </div>
                    <input
                        type="checkbox"
                        checked={availableOnly}
                        onChange={(event) => setAvailableOnly(event.target.checked)}
                        className="hidden"
                    />
                </label>
            </div>

            <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">
                    <Briefcase className="h-4 w-4 text-primary-500" />
                    {copy.category}
                </h3>
                <div className="space-y-2">
                    {CATEGORY_OPTIONS.map((category) => (
                        <label key={category} className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/70 dark:hover:bg-white/5">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={() =>
                                    setSelectedCategories((prev) =>
                                        prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
                                    )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-[#413c54] dark:text-[#cecadd]">{category}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">
                    <Award className="h-4 w-4 text-amber-500" />
                    {copy.skills}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => {
                        const active = selectedSkills.includes(skill);
                        return (
                            <button
                                key={skill}
                                type="button"
                                onClick={() =>
                                    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]))
                                }
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    active
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                        : 'border border-white/70 bg-white/80 text-[#5f5974] hover:border-primary-200 hover:text-primary-700 dark:border-white/8 dark:bg-white/5 dark:text-[#b9b4c8] dark:hover:border-primary-500/20 dark:hover:text-primary-200'
                                }`}
                            >
                                {skill}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{copy.hourlyRate}</h3>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="number"
                        value={rateRange[0]}
                        onChange={(event) => setRateRange([Number(event.target.value), rateRange[1]])}
                        className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 text-center text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-white/8 dark:bg-white/5 dark:focus:ring-primary-500/20"
                    />
                    <input
                        type="number"
                        value={rateRange[1]}
                        onChange={(event) => setRateRange([rateRange[0], Number(event.target.value)])}
                        className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 text-center text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-white/8 dark:bg-white/5 dark:focus:ring-primary-500/20"
                    />
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">Rating</h3>
                <div className="grid grid-cols-4 gap-2">
                    {[0, 4, 4.5, 4.8].map((rating) => (
                        <button
                            key={rating}
                            type="button"
                            onClick={() => setMinRating(rating)}
                            className={`rounded-2xl px-3 py-2 text-sm font-semibold transition-colors ${
                                minRating === rating
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    : 'border border-white/70 bg-white/80 text-[#5f5974] dark:border-white/8 dark:bg-white/5 dark:text-[#b9b4c8]'
                            }`}
                        >
                            {rating === 0 ? 'All' : `${rating}+`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:border-blue-500/10 dark:bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(255,255,255,0.03))]">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                        <div className="font-semibold text-[#191627] dark:text-white">{copy.verifiedOnly}</div>
                        <div className="mt-1 text-sm text-[#6e6884] dark:text-[#9a95ad]">{copy.verifiedOnlyDesc}</div>
                    </div>
                    <div className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${verifiedOnly ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/10'}`}>
                        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${verifiedOnly ? 'translate-x-5' : ''}`} />
                    </div>
                    <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(event) => setVerifiedOnly(event.target.checked)}
                        className="hidden"
                    />
                </label>
            </div>

            <Button variant="outline" className="w-full" onClick={clearFilters}>
                {copy.clearFilters}
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f7ff] text-[#191627] transition-colors duration-300 dark:bg-[#09070f] dark:text-white">
            <SEO {...SEO_CONFIG.findFreelancers} url="/find-freelancers" />
            <Header />

            <section className="relative overflow-hidden border-b border-white/40 bg-white/80 pt-10 pb-16 backdrop-blur-xl dark:border-white/5 dark:bg-[#0f0d16]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,247,255,0.74))] dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_35%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_25%),linear-gradient(180deg,rgba(15,13,22,0.96),rgba(9,7,15,0.94))]" />
                <div className="container-custom relative z-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-white/80 px-3 py-1 text-xs font-bold text-primary-700 shadow-sm backdrop-blur dark:border-primary-500/20 dark:bg-white/5 dark:text-primary-300">
                                <Sparkles className="h-3 w-3" />
                                <span>{copy.hero.badge}</span>
                            </div>
                            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-[#171420] dark:text-white md:text-5xl">
                                {copy.hero.title}{' '}
                                <span className="bg-gradient-to-r from-primary-500 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                                    {copy.hero.titleHighlight}
                                </span>
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5e5973] dark:text-[#a8a4b9] md:text-lg">
                                {copy.hero.subtitle}
                                <span className="hidden md:inline">{copy.hero.subtitleDesktop}</span>
                            </p>
                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <div className="glass-card rounded-[24px] px-4 py-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{copy.heroStats.talentPool}</div>
                                    <div className="mt-2 text-2xl font-bold">{(freelancersData?.length || 0).toLocaleString()}+</div>
                                </div>
                                <div className="glass-card rounded-[24px] px-4 py-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{copy.heroStats.verified}</div>
                                    <div className="mt-2 text-2xl font-bold">{(freelancersData || []).filter((f: FreelancerRecord) => f.is_verified).length}</div>
                                </div>
                                <div className="glass-card rounded-[24px] px-4 py-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{copy.heroStats.fastReplies}</div>
                                    <div className="mt-2 text-2xl font-bold">4.9/5</div>
                                </div>
                            </div>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-lg shadow-primary-500/10 backdrop-blur dark:border-white/8 dark:bg-white/5">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                aria-pressed={viewMode === 'grid'}
                                className={`rounded-xl p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300' : 'text-[#87819a] hover:text-[#1d1a28] dark:hover:text-white'}`}
                            >
                                <Grid className="h-5 w-5" />
                            </button>
                            <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                aria-pressed={viewMode === 'list'}
                                className={`rounded-xl p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300' : 'text-[#87819a] hover:text-[#1d1a28] dark:hover:text-white'}`}
                            >
                                <List className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-custom py-10">
                <div className="mb-6 lg:hidden">
                    <Button onClick={() => setShowFilters(true)} className="w-full justify-between">
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal className="h-5 w-5" />
                            {copy.filterToggle}
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{filteredFreelancers.length}</span>
                    </Button>
                </div>

                <div className="flex items-start gap-8">
                    <aside className="sticky top-28 hidden w-80 shrink-0 lg:block">
                        <div className="glass-card rounded-[28px] p-6 shadow-xl shadow-primary-500/8">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-primary-500" />
                                    <h2 className="text-lg font-bold">{copy.filterTitle}</h2>
                                </div>
                                {activeFilterCount > 0 ? (
                                    <button type="button" onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:underline">
                                        {copy.clearAll}
                                    </button>
                                ) : null}
                            </div>
                            <FilterSidebar />
                        </div>
                    </aside>

                    <main className="min-w-0 flex-1">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-[#6e6884] dark:text-[#9a95ad]">
                                <span>{copy.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}</span>
                                {activeFilterCount > 0 ? (
                                    <span className="rounded-full border border-primary-200/70 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                                        {activeFilterCount} {copy.activeFilters}
                                    </span>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur dark:border-white/8 dark:bg-white/5">
                                <span className="hidden text-sm text-[#6e6884] dark:text-[#9a95ad] sm:inline">{copy.sort.label}</span>
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    className="cursor-pointer border-none bg-transparent pr-8 text-sm font-semibold focus:outline-none"
                                >
                                    <option value="recommended">{copy.sort.recommended}</option>
                                    <option value="rating">{copy.sort.rating}</option>
                                    <option value="rate_low">{copy.sort.priceLow}</option>
                                </select>
                            </div>
                        </div>

                        {!isLoading && filteredFreelancers.length > 0 ? (
                            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-white/8 dark:bg-white/5">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{copy.resultStats.availableNow}</div>
                                    <div className="mt-2 text-2xl font-bold">
                                        {filteredFreelancers.filter((freelancer) => freelancer.is_available).length}
                                    </div>
                                </div>
                                <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-white/8 dark:bg-white/5">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{copy.resultStats.averageRate}</div>
                                    <div className="mt-2 text-2xl font-bold">{averageRate} TND</div>
                                </div>
                                <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-white/8 dark:bg-white/5">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{copy.resultStats.topRating}</div>
                                    <div className="mt-2 text-2xl font-bold">{topRating}</div>
                                </div>
                            </div>
                        ) : null}

                        {isLoading ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <SkeletonProfile key={index} />
                                    ))}
                                </div>
                            ) : (
                                <SkeletonList count={6} />
                            )
                        ) : filteredFreelancers.length > 0 ? (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
                                {filteredFreelancers.map((freelancer, index) => (
                                    <div key={freelancer.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
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
                                title={copy.noResults.title}
                                description={copy.noResults.description}
                                action={{
                                    label: copy.noResults.action,
                                    onClick: clearFilters,
                                    variant: 'primary',
                                }}
                                className="rounded-[32px]"
                            />
                        )}
                    </main>
                </div>
            </div>

            {showFilters ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-[#09070f]/70 backdrop-blur-sm"
                        onClick={() => setShowFilters(false)}
                    />
                    <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-[32px] border border-white/10 bg-[#120f1d] text-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <h2 className="text-lg font-bold">{copy.filterTitle}</h2>
                            <button type="button" onClick={() => setShowFilters(false)} className="rounded-full bg-white/5 p-2">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <FilterSidebar />
                        </div>
                        <div className="border-t border-white/10 p-6">
                            <Button className="w-full" onClick={() => setShowFilters(false)}>
                                {copy.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
