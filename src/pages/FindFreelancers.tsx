 import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, Grid, List, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';

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
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['saved-freelancers', user?.id] });
            showToast(
                variables.isSaved
                    ? tx('findFreelancers.toasts.removedFromSaved', undefined, 'Removed from saved freelancers')
                    : tx('findFreelancers.toasts.savedFreelancer', undefined, 'Saved freelancer'),
                'success',
            );
        },
        onError: () => {
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
        <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
            <SEO {...SEO_CONFIG.findFreelancers} url="/find-freelancers" canonical="https://workedin.tn/find-freelancers" />
            <Header />

            <section className="relative overflow-hidden border-b pt-10 pb-16 backdrop-blur-xl" style={{ borderColor: 'var(--border)', background: 'var(--page-bg)' }}>
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at top left, color-mix(in srgb, var(--workspace-primary) 18%, transparent), transparent 35%), radial-gradient(circle at top right, color-mix(in srgb, var(--workspace-accent) 14%, transparent), transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--page-bg) 92%, white), color-mix(in srgb, var(--page-bg) 100%, transparent))' }} />
                <div className="container-custom relative z-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)', background: 'color-mix(in srgb, var(--workspace-primary) 7%, var(--card-bg))', color: 'var(--workspace-primary)' }}>
                                <Sparkles className="h-3 w-3" />
                                <span>{copy.hero.badge}</span>
                            </div>
                            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] md:text-5xl" style={{ color: 'var(--text-primary)' }}>
                                {copy.hero.title}{' '}
                                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, var(--workspace-primary), var(--workspace-primary-mid))' }}>
                                    {copy.hero.titleHighlight}
                                </span>
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                                {copy.hero.subtitle}
                                <span className="hidden md:inline">{copy.hero.subtitleDesktop}</span>
                            </p>
                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[24px] px-4 py-4 border" style={{ background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)', borderColor: 'var(--border)' }}>
                                    <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{copy.heroStats.talentPool}</div>
                                    <div className="mt-2 text-2xl font-bold">{(freelancersData?.length || 0).toLocaleString()}+</div>
                                </div>
                                <div className="rounded-[24px] px-4 py-4 border" style={{ background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)', borderColor: 'var(--border)' }}>
                                    <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{copy.heroStats.verified}</div>
                                    <div className="mt-2 text-2xl font-bold">{(freelancersData || []).filter((f: FreelancerRecord) => f.is_verified).length}</div>
                                </div>
                                <div className="rounded-[24px] px-4 py-4 border" style={{ background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)', borderColor: 'var(--border)' }}>
                                    <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{copy.heroStats.fastReplies}</div>
                                    <div className="mt-2 text-2xl font-bold">4.9/5</div>
                                </div>
                            </div>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-2xl border p-1.5 shadow-lg backdrop-blur" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)' }}>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                aria-label="عرض شبْ�`"
                                aria-pressed={viewMode === 'grid'}
                                className="rounded-xl p-2.5 transition-colors"
                                style={viewMode === 'grid' ? { background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', color: 'var(--workspace-primary)' } : { color: 'var(--text-muted)' }}
                            >
                                <Grid className="h-5 w-5" />
                            </button>
                            <div className="h-6 w-px bg-border" />
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                aria-label="عرض �ائ�&ة"
                                aria-pressed={viewMode === 'list'}
                                className="rounded-xl p-2.5 transition-colors"
                                style={viewMode === 'list' ? { background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', color: 'var(--workspace-primary)' } : { color: 'var(--text-muted)' }}
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
                        <span className="rounded-full bg-card/20 px-2 py-0.5 text-xs">{filteredFreelancers.length}</span>
                    </Button>
                </div>

                <div className="flex items-start gap-8">
                    <aside className="sticky top-28 hidden w-80 shrink-0 lg:block z-10">
                        <div className="rounded-[28px] p-6 border" style={{ background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)', borderColor: 'var(--border)', boxShadow: '0 24px 60px -44px color-mix(in srgb, var(--workspace-primary) 28%, transparent)' }}>
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" style={{ color: 'var(--workspace-primary)' }} />
                                    <h2 className="text-lg font-bold">{copy.filterTitle}</h2>
                                </div>
                                {activeFilterCount > 0 ? (
                                    <button type="button" onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:underline">
                                        {copy.clearAll}
                                    </button>
                                ) : null}
                            </div>
                            <FilterSidebar
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                availableOnly={availableOnly}
                                setAvailableOnly={setAvailableOnly}
                                selectedCategories={selectedCategories}
                                setSelectedCategories={setSelectedCategories}
                                selectedSkills={selectedSkills}
                                setSelectedSkills={setSelectedSkills}
                                rateRange={rateRange}
                                setRateRange={setRateRange}
                                minRating={minRating}
                                setMinRating={setMinRating}
                                verifiedOnly={verifiedOnly}
                                setVerifiedOnly={setVerifiedOnly}
                                clearFilters={clearFilters}
                                copy={copy}
                                tx={tx}
                                categoryOptions={CATEGORY_OPTIONS}
                                skillOptions={SKILL_OPTIONS}
                            />
                        </div>
                    </aside>

                    <main className="min-w-0 flex-1 overflow-hidden">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <span>{copy.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}</span>
                                {activeFilterCount > 0 ? (
                                    <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)', background: 'color-mix(in srgb, var(--workspace-primary) 8%, transparent)', color: 'var(--workspace-primary)' }}>
                                        {activeFilterCount} {copy.activeFilters}
                                    </span>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm backdrop-blur" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)' }}>
                                <span className="hidden text-sm sm:inline" style={{ color: 'var(--text-muted)' }}>{copy.sort.label}</span>
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    className="cursor-pointer border-none bg-transparent pe-8 text-sm font-semibold focus:outline-none"
                                >
                                    <option value="recommended">{copy.sort.recommended}</option>
                                    <option value="rating">{copy.sort.rating}</option>
                                    <option value="rate_low">{copy.sort.priceLow}</option>
                                </select>
                            </div>
                        </div>

                        {!isLoading && filteredFreelancers.length > 0 ? (
                            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[24px] border px-4 py-4 shadow-sm backdrop-blur" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)' }}>
                                    <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{copy.resultStats.availableNow}</div>
                                    <div className="mt-2 text-2xl font-bold">
                                        {filteredFreelancers.filter((freelancer) => freelancer.is_available).length}
                                    </div>
                                </div>
                                <div className="rounded-[24px] border px-4 py-4 shadow-sm backdrop-blur" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)' }}>
                                    <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{copy.resultStats.averageRate}</div>
                                    <div className="mt-2 text-2xl font-bold">{averageRate} TND</div>
                                </div>
                                <div className="rounded-[24px] border px-4 py-4 shadow-sm backdrop-blur" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)' }}>
                                    <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{copy.resultStats.topRating}</div>
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
                            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'} cv-auto`}>
                                {filteredFreelancers.map((freelancer, index) => (
                                    <div key={freelancer.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                        <FreelancerCard
                                            freelancer={freelancer}
                                            viewMode={viewMode}
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
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowFilters(false)}
                    />
                    <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-[32px] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-5">
                            <h2 className="text-lg font-bold">{copy.filterTitle}</h2>
                            <button type="button" onClick={() => setShowFilters(false)} className="rounded-full bg-[var(--color-bg-muted)] p-2">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <FilterSidebar
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                availableOnly={availableOnly}
                                setAvailableOnly={setAvailableOnly}
                                selectedCategories={selectedCategories}
                                setSelectedCategories={setSelectedCategories}
                                selectedSkills={selectedSkills}
                                setSelectedSkills={setSelectedSkills}
                                rateRange={rateRange}
                                setRateRange={setRateRange}
                                minRating={minRating}
                                setMinRating={setMinRating}
                                verifiedOnly={verifiedOnly}
                                setVerifiedOnly={setVerifiedOnly}
                                clearFilters={clearFilters}
                                copy={copy}
                                tx={tx}
                                categoryOptions={CATEGORY_OPTIONS}
                                skillOptions={SKILL_OPTIONS}
                            />
                        </div>
                        <div className="border-t border-[var(--color-border-default)] p-6">
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

