import { Award, Briefcase, Search } from 'lucide-react';
import Button from '../ui/Button';

type FreelancerCategory = 'Design' | 'Development' | 'Writing' | 'Marketing' | 'Video' | 'Consulting';

interface FilterSidebarProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    availableOnly: boolean;
    setAvailableOnly: (value: boolean) => void;
    selectedCategories: FreelancerCategory[];
    setSelectedCategories: React.Dispatch<React.SetStateAction<FreelancerCategory[]>>;
    selectedSkills: string[];
    setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;
    rateRange: [number, number];
    setRateRange: React.Dispatch<React.SetStateAction<[number, number]>>;
    minRating: number;
    setMinRating: (value: number) => void;
    verifiedOnly: boolean;
    setVerifiedOnly: (value: boolean) => void;
    clearFilters: () => void;
    copy: any;
    tx: (key: string, params?: any, fallback?: string) => string;
    categoryOptions: FreelancerCategory[];
    skillOptions: string[];
}

export default function FilterSidebar({
    searchQuery,
    setSearchQuery,
    availableOnly,
    setAvailableOnly,
    selectedCategories,
    setSelectedCategories,
    selectedSkills,
    setSelectedSkills,
    rateRange,
    setRateRange,
    minRating,
    setMinRating,
    verifiedOnly,
    setVerifiedOnly,
    clearFilters,
    copy,
    tx,
    categoryOptions,
    skillOptions,
}: FilterSidebarProps) {
    return (
        <div className="space-y-8">
            <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                    <Search className="h-5 w-5 text-[#8a839f] transition-colors group-focus-within:text-brand" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="block w-full rounded-2xl border border-white/70 bg-card/85 p-4 pe-11 text-sm text-[#191627] shadow-sm backdrop-blur transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-white/8 dark:bg-white/5 dark:text-white dark:focus:ring-brand/20"
                />
            </div>

            <div className="rounded-3xl border p-4 shadow-sm" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, var(--border))', background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 8%, transparent), color-mix(in srgb, var(--card-bg) 90%, transparent))' }}>
                <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                        <div className="font-semibold text-[#191627] dark:text-white">{copy.availableNow}</div>
                        <div className="mt-1 text-sm text-[#6e6884] dark:text-[#9a95ad]">{copy.availableNowDesc}</div>
                    </div>
                    <div className="flex h-7 w-12 items-center rounded-full p-1 transition-colors" style={{ background: availableOnly ? 'var(--workspace-primary)' : 'rgba(255,255,255,0.1)' }}>
                        <div className={`h-5 w-5 rounded-full bg-card shadow transition-transform ${availableOnly ? 'translate-x-5' : ''}`} />
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
                    <Briefcase className="h-4 w-4 text-brand" />
                    {copy.category}
                </h3>
                <div className="space-y-2">
                    {categoryOptions.map((category) => (
                        <label key={category} className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-card/70 dark:hover:bg-card/5">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={() =>
                                    setSelectedCategories((prev) =>
                                        prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
                                    )
                                }
                                className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
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
                    {skillOptions.map((skill) => {
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
                                        ? 'bg-brand text-brand-text shadow-lg shadow-brand/25'
                                        : 'border border-white/70 bg-card/80 text-[#5f5974] hover:border-brand hover:text-brand dark:border-white/8 dark:bg-white/5 dark:text-[#b9b4c8] dark:hover:border-brand/30 dark:hover:text-brand-mid'
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
                        className="rounded-2xl border border-white/70 bg-card/80 px-3 py-3 text-center text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-white/8 dark:bg-white/5 dark:focus:ring-brand/20"
                    />
                    <input
                        type="number"
                        value={rateRange[1]}
                        onChange={(event) => setRateRange([rateRange[0], Number(event.target.value)])}
                        className="rounded-2xl border border-white/70 bg-card/80 px-3 py-3 text-center text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-white/8 dark:bg-white/5 dark:focus:ring-brand/20"
                    />
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#7a7590] dark:text-[#918ba8]">{tx('findFreelancers.rating', undefined, 'Rating')}</h3>
                <div className="grid grid-cols-4 gap-2">
                    {[0, 4, 4.5, 4.8].map((rating) => (
                        <button
                            key={rating}
                            type="button"
                            onClick={() => setMinRating(rating)}
                            className={`rounded-2xl px-3 py-2 text-sm font-semibold transition-colors ${
                                minRating === rating
                                    ? 'bg-brand text-brand-text shadow-lg shadow-brand/20'
                                    : 'border border-white/70 bg-card/80 text-[#5f5974] hover:border-brand hover:text-brand dark:border-white/8 dark:bg-white/5 dark:text-[#b9b4c8] dark:hover:border-brand/30 dark:hover:text-brand-mid'
                            }`}
                        >
                            {rating === 0 ? tx('findFreelancers.all', undefined, 'All') : `${rating}+`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl border p-4 shadow-sm" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, var(--border))', background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 8%, transparent), color-mix(in srgb, var(--card-bg) 90%, transparent))' }}>
                <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                        <div className="font-semibold text-[#191627] dark:text-white">{copy.verifiedOnly}</div>
                        <div className="mt-1 text-sm text-[#6e6884] dark:text-[#9a95ad]">{copy.verifiedOnlyDesc}</div>
                    </div>
                    <div className="flex h-7 w-12 items-center rounded-full p-1 transition-colors" style={{ background: verifiedOnly ? 'var(--workspace-primary)' : 'rgba(255,255,255,0.1)' }}>
                        <div className={`h-5 w-5 rounded-full bg-card shadow transition-transform ${verifiedOnly ? 'translate-x-5' : ''}`} />
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
}
