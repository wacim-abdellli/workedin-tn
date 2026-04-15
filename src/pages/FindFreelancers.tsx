 import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Filter, Grid, List, Search, SlidersHorizontal, Sparkles, UserCircle2, X } from 'lucide-react';

import SEO, { SEO_CONFIG } from '../components/common/SEO';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList, SkeletonProfile } from '../components/common';
import FreelancerCard from '../components/freelancers/FreelancerCard';
import FilterSidebar from '../components/freelancers/FilterSidebar';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n';
import * as profilesService from '../services/profiles';
import { canSaveFreelancer, getAccessMessage } from '../lib/marketplaceAccess';

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

interface ProfileWithFreelancer {
    id: string;
    full_name?: string;
    avatar_url?: string;
    location?: string;
    freelancer_profiles?: {
        title?: string;
        hourly_rate?: number;
        skills?: { name?: string }[] | string[];
        success_rate?: number;
        jobs_completed?: number;
        cin_verified?: boolean;
        availability?: string;
    }[];
}

interface ReviewStats {
    [userId: string]: {
        averageRating: number;
        reviewCount: number;
    };
}

const CATEGORY_OPTIONS: FreelancerCategory[] = ['Design', 'Development', 'Writing', 'Marketing', 'Video', 'Consulting'];
const SKILL_OPTIONS = ['React', 'Node.js', 'Logo Design', 'Translation', 'Content Writing', 'Figma', 'Motion', 'SEO'];

export default function FindFreelancers() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, tx } = useTranslation();
    const { user, profile, freelancerProfile } = useAuth();
    const { showToast } = useToast();
    const copy = t.findFreelancers;

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('recommended');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<FreelancerCategory[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [rateRange, setRateRange] = useState<[number, number]>([0, 100]);
    const [availableOnly, setAvailableOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const saveDecision = canSaveFreelancer({
        isAuthenticated: !!user,
        profile,
        freelancerProfile,
    });

    // Fetch real freelancers from DB
    const { data: freelancersData, isLoading } = useQuery({
        queryKey: ['freelancers'],
        queryFn: async () => {
            const { data, error } = await profilesService.getFreelancers({ excludeId: user?.id });
            if (error) { console.error('getFreelancers error:', error); return []; }
            
            // Fetch review stats for all freelancers in bulk
            const freelancerIds = (data || []).map((p: ProfileWithFreelancer) => p.id);
            const reviewStatsMap: ReviewStats = {};
            
            if (freelancerIds.length > 0) {
                const { data: reviewsData } = await profilesService.supabase
                    .from('reviews')
                    .select('reviewee_id, rating')
                    .in('reviewee_id', freelancerIds)
                    .eq('is_public', true);
                
                // Calculate stats for each freelancer
                if (reviewsData) {
                    reviewsData.forEach((review: any) => {
                        if (!reviewStatsMap[review.reviewee_id]) {
                            reviewStatsMap[review.reviewee_id] = { averageRating: 0, reviewCount: 0 };
                        }
                        reviewStatsMap[review.reviewee_id].reviewCount++;
                    });
                    
                    // Calculate averages
                    Object.keys(reviewStatsMap).forEach(userId => {
                        const userReviews = reviewsData.filter((r: any) => r.reviewee_id === userId);
                        const totalRating = userReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
                        reviewStatsMap[userId].averageRating = Math.round((totalRating / userReviews.length) * 10) / 10;
                    });
                }
            }
            
            return (data || []).map((p: ProfileWithFreelancer) => {
                const fp = Array.isArray(p.freelancer_profiles) 
                    ? p.freelancer_profiles[0] 
                    : p.freelancer_profiles;
                const skills: string[] = Array.isArray(fp?.skills)
                    ? fp.skills.map((s: any) => (typeof s === 'string' ? s : s?.name || '')).filter(Boolean)
                    : [];
                
                const reviewStats = reviewStatsMap[p.id] || { averageRating: 0, reviewCount: 0 };
                
                // Infer category from skills or title
                const inferCategory = (): FreelancerCategory => {
                    const skillsLower = skills.map(s => s.toLowerCase()).join(' ');
                    const titleLower = (fp?.title || '').toLowerCase();
                    const combined = `${skillsLower} ${titleLower}`;
                    
                    if (combined.match(/design|figma|photoshop|illustrator|ui|ux|graphic/)) return 'Design';
                    if (combined.match(/develop|react|node|javascript|python|code|programming/)) return 'Development';
                    if (combined.match(/writ|content|blog|article|copy/)) return 'Writing';
                    if (combined.match(/market|seo|social|ads|campaign/)) return 'Marketing';
                    if (combined.match(/video|edit|motion|animation/)) return 'Video';
                    if (combined.match(/consult|strategy|business|advisor/)) return 'Consulting';
                    
                    return 'Development'; // Default fallback
                };
                
                return {
                    id: p.id,
                    category: inferCategory(),
                    name: p.full_name || 'Freelancer',
                    title: fp?.title || '',
                    avatar: p.avatar_url || null,
                    rating: reviewStats.averageRating,
                    reviews: reviewStats.reviewCount,
                    hourly_rate: fp?.hourly_rate || 0,
                    location: p.location || '',
                    skills,
                    success_rate: fp?.success_rate || 0,
                    jobs_completed: fp?.jobs_completed || 0,
                    response_time: fp?.jobs_completed && fp.jobs_completed > 5 ? '< 2 hours' : '< 1 hour',
                    is_verified: fp?.cin_verified || false,
                    is_available: fp?.availability === 'available',
                } as FreelancerRecord;
            });
        },
        staleTime: 60_000,
    });

    const { data: savedFreelancers = [] } = useQuery({
        queryKey: ['saved-freelancers', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await profilesService.getSavedFreelancerIds(user.id);
            if (error) {
                console.error('getSavedFreelancerIds error:', error);
                return [];
            }

            return (data ?? [])
                .map((item) => item.freelancer_id)
                .filter((id): id is string => Boolean(id));
        },
        enabled: Boolean(user?.id),
        staleTime: 5 * 60 * 1000,
    });

    const toggleSavedMutation = useMutation({
        mutationFn: async ({ freelancerId, isSaved }: { freelancerId: string; isSaved: boolean }) => {
            if (!user?.id) {
                throw new Error('AUTH_REQUIRED');
            }

            const { error } = await profilesService.toggleFreelancerFavorite(user.id, freelancerId, isSaved);
            if (error) {
                throw error;
            }
        },
        onMutate: async ({ freelancerId, isSaved }) => {
            if (!user?.id) {
                return {
                    previousSavedFreelancers: [] as string[],
                    previousSavedFreelancerIdsPage: [] as string[],
                };
            }

            await queryClient.cancelQueries({ queryKey: ['saved-freelancers', user.id] });
            await queryClient.cancelQueries({ queryKey: ['saved-freelancer-ids-page', user.id] });

            const previousSavedFreelancers = queryClient.getQueryData<string[]>(['saved-freelancers', user.id]) ?? [];
            const previousSavedFreelancerIdsPage = queryClient.getQueryData<string[]>(['saved-freelancer-ids-page', user.id]) ?? [];

            const patchIds = (previous: string[]) => {
                if (isSaved) {
                    return previous.filter((id) => id !== freelancerId);
                }

                if (previous.includes(freelancerId)) {
                    return previous;
                }

                return [freelancerId, ...previous];
            };

            queryClient.setQueryData<string[]>(['saved-freelancers', user.id], patchIds(previousSavedFreelancers));
            queryClient.setQueryData<string[]>(['saved-freelancer-ids-page', user.id], patchIds(previousSavedFreelancerIdsPage));

            return {
                previousSavedFreelancers,
                previousSavedFreelancerIdsPage,
            };
        },
        onSuccess: (_, variables) => {
            if (!user?.id) {
                return;
            }

            queryClient.invalidateQueries({ queryKey: ['saved-freelancers', user.id] });
            queryClient.invalidateQueries({ queryKey: ['saved-freelancer-ids-page', user.id] });
            queryClient.invalidateQueries({ queryKey: ['saved-freelancer-pool-page', user.id] });

            showToast(
                variables.isSaved
                    ? tx('findFreelancers.toasts.removedFromSaved', undefined, 'Removed from saved freelancers')
                    : tx('findFreelancers.toasts.savedFreelancer', undefined, 'Saved freelancer'),
                'success',
            );
        },
        onError: (_error, _variables, context) => {
            if (user?.id && context) {
                queryClient.setQueryData<string[]>(['saved-freelancers', user.id], context.previousSavedFreelancers);
                queryClient.setQueryData<string[]>(['saved-freelancer-ids-page', user.id], context.previousSavedFreelancerIdsPage);
            }

            showToast(
                tx('findFreelancers.toasts.updateSavedFailed', undefined, 'Could not update saved freelancers'),
                'error',
            );
        },
    });

    const toggleSaved = useCallback((id: string) => {
        if (!saveDecision.allowed) {
            showToast(getAccessMessage(saveDecision.reason, saveDecision.completion), 'warning');
            if (saveDecision.nextStepPath) {
                navigate(saveDecision.nextStepPath, { state: { from: '/find-freelancers' } });
            }
            return;
        }

        toggleSavedMutation.mutate({
            freelancerId: id,
            isSaved: savedFreelancers.includes(id),
        });
    }, [navigate, saveDecision, savedFreelancers, showToast, toggleSavedMutation]);

    const savedFreelancerIds = useMemo(() => new Set(savedFreelancers), [savedFreelancers]);

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
                // Client-side search filter (searches in name, title, and skills)
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchesName = freelancer.name.toLowerCase().includes(query);
                    const matchesTitle = freelancer.title.toLowerCase().includes(query);
                    const matchesSkills = freelancer.skills.some(skill => skill.toLowerCase().includes(query));
                    if (!matchesName && !matchesTitle && !matchesSkills) return false;
                }
                
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
    }, [freelancersData, searchQuery, availableOnly, minRating, rateRange, selectedCategories, selectedSkills, sortBy, verifiedOnly]);

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

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white scroll-smooth">
            <SEO {...SEO_CONFIG.findFreelancers} url="/find-freelancers" canonical="https://workedin.tn/find-freelancers" />
            <Header />

            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-7 pb-7">
                <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 10% 50%, color-mix(in srgb,var(--workspace-primary) 10%,transparent) 0%, transparent 60%)' }} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Left: title + subtitle */}
                        <div className="min-w-0">
                            <div
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold mb-2"
                                style={{
                                    background: 'color-mix(in srgb,var(--workspace-primary) 12%,transparent)',
                                    border: '1px solid color-mix(in srgb,var(--workspace-primary) 25%,transparent)',
                                    color: 'var(--workspace-primary)',
                                }}
                            >
                                <Sparkles className="h-2.5 w-2.5" />
                                {copy.hero.badge}
                            </div>
                            <h1 className="text-2xl font-black tracking-tight leading-tight">
                                {copy.hero.title}{' '}
                                <span style={{ color: 'var(--workspace-primary)' }}>{copy.hero.titleHighlight}</span>
                            </h1>
                            <p className="text-white/40 text-sm mt-1 max-w-lg">
                                {copy.hero.subtitle}
                            </p>
                        </div>

                        {/* Right: stats + view toggle */}
                        <div className="flex items-center gap-3 shrink-0">
                            {[
                                { label: copy.heroStats.talentPool, value: `${(freelancersData?.length || 0).toLocaleString()}+` },
                                { label: copy.heroStats.verified,   value: String((freelancersData || []).filter((f: FreelancerRecord) => f.is_verified).length) },
                            ].map(({ label, value }) => (
                                <div key={label} className="rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-center hidden sm:block">
                                    <p className="text-base font-black text-white">{value}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-white/30">{label}</p>
                                </div>
                            ))}

                            {/* View toggle */}
                            <div className="flex items-center gap-0.5 rounded-xl border border-white/8 bg-white/4 p-1">
                                {([
                                    { mode: 'grid', Icon: Grid, label: 'Grid' },
                                    { mode: 'list', Icon: List, label: 'List' },
                                ] as const).map(({ mode, Icon, label }) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        aria-label={label}
                                        aria-pressed={viewMode === mode}
                                        onClick={() => setViewMode(mode)}
                                        className="rounded-lg p-2 transition-all"
                                        style={viewMode === mode
                                            ? { background: 'color-mix(in srgb,var(--workspace-primary) 15%,transparent)', color: 'var(--workspace-primary)' }
                                            : { color: 'rgba(255,255,255,0.3)' }
                                        }
                                    >
                                        <Icon className="h-4 w-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Body ── */}
            <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">

                {/* Mobile filter button */}
                <div className="mb-5 lg:hidden pt-5">
                    <button
                        type="button"
                        onClick={() => setShowFilters(true)}
                        className="w-full flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-5 py-3 text-sm font-semibold text-white"
                    >
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 opacity-60" />
                            {copy.filterToggle}
                        </span>
                        {activeFilterCount > 0 && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'color-mix(in srgb,var(--workspace-primary) 15%,transparent)', color: 'var(--workspace-primary)', border: '1px solid color-mix(in srgb,var(--workspace-primary) 25%,transparent)' }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Two-column layout — roomy viewport with sticky filter rail */}
                <div className="flex items-start gap-6 pt-6">
                    {/* Sidebar — scrolls independently, stays on screen */}
                    <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] z-10">
                        <div className="freelancer-scroll rounded-2xl border border-white/8 p-5 flex flex-col overflow-y-auto" style={{ background: 'rgba(255,255,255,0.025)' }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                                    <Filter className="h-4 w-4 opacity-60" />
                                    {copy.filterTitle}
                                </h2>
                                {activeFilterCount > 0 && (
                                    <button type="button" onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-semibold">
                                        {copy.clearAll}
                                    </button>
                                )}
                            </div>
                            <FilterSidebar
                                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                                availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
                                selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                                selectedSkills={selectedSkills} setSelectedSkills={setSelectedSkills}
                                rateRange={rateRange} setRateRange={setRateRange}
                                minRating={minRating} setMinRating={setMinRating}
                                verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
                                clearFilters={clearFilters} copy={copy} tx={tx}
                                categoryOptions={CATEGORY_OPTIONS} skillOptions={SKILL_OPTIONS}
                            />
                        </div>
                    </aside>

                    {/* Main */}
                    <main className="min-w-0 flex-1">
                        {/* Toolbar */}
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2.5">
                                <p className="text-sm text-white/45">
                                    {copy.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}
                                </p>
                                {activeFilterCount > 0 && (
                                    <span className="rounded-full text-xs font-semibold px-2.5 py-0.5"
                                        style={{ background: 'color-mix(in srgb,var(--workspace-primary) 12%,transparent)', color: 'var(--workspace-primary)', border: '1px solid color-mix(in srgb,var(--workspace-primary) 25%,transparent)' }}>
                                        {activeFilterCount} {copy.activeFilters}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/saved')}
                                    className="!h-10 !rounded-xl !border !border-white/10 !bg-white/5 !px-3 !text-xs !font-semibold !text-white/80 hover:!border-white/20 hover:!text-white"
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <Bookmark className="h-3.5 w-3.5" />
                                        {tx('nav.saved', undefined, 'Saved')}
                                    </span>
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/profile')}
                                    className="!h-10 !rounded-xl !border !border-white/10 !bg-white/5 !px-3 !text-xs !font-semibold !text-white/80 hover:!border-white/20 hover:!text-white"
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <UserCircle2 className="h-3.5 w-3.5" />
                                        {tx('nav.account', undefined, 'Account')}
                                    </span>
                                </Button>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70 outline-none appearance-none cursor-pointer focus:border-[var(--workspace-primary)] transition-colors"
                                >
                                    <option value="recommended">{copy.sort.recommended}</option>
                                    <option value="rating">{copy.sort.rating}</option>
                                    <option value="rate_low">{copy.sort.priceLow}</option>
                                </select>
                            </div>
                        </div>

                        {/* Result stats */}
                        {!isLoading && filteredFreelancers.length > 0 && (
                            <div className="mb-5 grid grid-cols-3 gap-3">
                                {[
                                    { label: copy.resultStats.availableNow, value: filteredFreelancers.filter((f) => f.is_available).length },
                                    { label: copy.resultStats.averageRate, value: `${averageRate} TND` },
                                    { label: copy.resultStats.topRating, value: topRating },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                                        <p className="text-base font-black text-white">{value}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cards */}
                        {isLoading ? (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-white/8 bg-white/3 animate-pulse h-48" />
                                ))}
                            </div>
                        ) : filteredFreelancers.length > 0 ? (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
                                {filteredFreelancers.map((freelancer, index) => (
                                    <div key={freelancer.id} style={{ animationDelay: `${index * 40}ms`, animation: 'fadeUp 0.35s ease both' }}>
                                        <FreelancerCard
                                            freelancer={freelancer} viewMode={viewMode}
                                            isSaved={savedFreelancerIds.has(freelancer.id)}
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
                                action={{ label: copy.noResults.action, onClick: clearFilters, variant: 'primary' }}
                                className="rounded-2xl"
                            />
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile filter drawer */}
            {showFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={() => setShowFilters(false)}
                    />
                    <div
                        className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-3xl border border-white/8"
                        style={{ background: '#12121a' }}
                    >
                        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                            <h2 className="text-base font-bold text-white">{copy.filterTitle}</h2>
                            <button type="button" onClick={() => setShowFilters(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-white/60 hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="freelancer-scroll flex-1 overflow-y-auto px-5 py-5">
                            <FilterSidebar
                                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                                availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
                                selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                                selectedSkills={selectedSkills} setSelectedSkills={setSelectedSkills}
                                rateRange={rateRange} setRateRange={setRateRange}
                                minRating={minRating} setMinRating={setMinRating}
                                verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
                                clearFilters={clearFilters} copy={copy} tx={tx}
                                categoryOptions={CATEGORY_OPTIONS} skillOptions={SKILL_OPTIONS}
                            />
                        </div>
                        <div className="border-t border-white/8 p-5">
                            <button
                                type="button"
                                onClick={() => setShowFilters(false)}
                                className="w-full h-12 rounded-2xl font-bold text-white text-sm"
                                style={{ background: 'linear-gradient(135deg,var(--workspace-primary) 0%,color-mix(in srgb,var(--workspace-primary) 70%,#000) 100%)' }}
                            >
                                {copy.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .freelancer-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: color-mix(in srgb, var(--workspace-primary) 42%, rgba(255,255,255,0.2)) transparent;
                    overscroll-behavior: contain;
                    scrollbar-gutter: stable;
                }

                .freelancer-scroll::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .freelancer-scroll::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                    border-radius: 999px;
                }

                .freelancer-scroll::-webkit-scrollbar-thumb {
                    background: linear-gradient(
                        180deg,
                        color-mix(in srgb, var(--workspace-primary) 55%, rgba(255,255,255,0.25)),
                        color-mix(in srgb, var(--workspace-primary) 32%, rgba(255,255,255,0.18))
                    );
                    border-radius: 999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

                .freelancer-scroll::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(
                        180deg,
                        color-mix(in srgb, var(--workspace-primary) 72%, rgba(255,255,255,0.3)),
                        color-mix(in srgb, var(--workspace-primary) 44%, rgba(255,255,255,0.22))
                    );
                }
            `}</style>
        </div>
    );
}
