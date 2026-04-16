import { Award, Briefcase, Search, Star } from 'lucide-react';

type FreelancerCategory = 'Design' | 'Development' | 'Writing' | 'Marketing' | 'Video' | 'Consulting';

interface FilterSidebarProps {
    searchQuery: string; setSearchQuery: (v: string) => void;
    availableOnly: boolean; setAvailableOnly: (v: boolean) => void;
    selectedCategories: FreelancerCategory[];
    setSelectedCategories: React.Dispatch<React.SetStateAction<FreelancerCategory[]>>;
    selectedSkills: string[];
    setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;
    rateRange: [number, number];
    setRateRange: React.Dispatch<React.SetStateAction<[number, number]>>;
    minRating: number; setMinRating: (v: number) => void;
    verifiedOnly: boolean; setVerifiedOnly: (v: boolean) => void;
    clearFilters: () => void;
    copy: any; tx: (key: string, params?: any, fallback?: string) => string;
    categoryOptions: FreelancerCategory[]; skillOptions: string[];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">{children}</p>
    );
}

const COLORS = {
    primary: 'var(--workspace-primary,#8b5cf6)',
    primaryLight: 'color-mix(in srgb,var(--workspace-primary,#8b5cf6) 12%,transparent)',
    primaryBorder: 'color-mix(in srgb,var(--workspace-primary,#8b5cf6) 25%,transparent)',
};

export default function FilterSidebar({
    searchQuery, setSearchQuery,
    availableOnly, setAvailableOnly,
    selectedCategories, setSelectedCategories,
    selectedSkills, setSelectedSkills,
    rateRange, setRateRange,
    minRating, setMinRating,
    verifiedOnly, setVerifiedOnly,
    clearFilters, copy, tx,
    categoryOptions, skillOptions,
}: FilterSidebarProps) {
    const statusFilters = [
        {
            key: 'available' as const,
            checked: availableOnly,
            onToggle: () => setAvailableOnly(!availableOnly),
            label: copy.availableNow,
            description: copy.availableNowDesc,
        },
        {
            key: 'verified' as const,
            checked: verifiedOnly,
            onToggle: () => setVerifiedOnly(!verifiedOnly),
            label: copy.verifiedOnly,
            description: copy.verifiedOnlyDesc,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white bg-white/5 border border-white/8 outline-none focus:border-[var(--workspace-primary,#8b5cf6)] transition-colors placeholder-white/30"
                />
            </div>

            {/* Status */}
            <div className="pt-4 border-t border-white/8">
                <SectionLabel>{tx('findFreelancers.status', undefined, 'Status')}</SectionLabel>
                <div className="space-y-2.5">
                    {statusFilters.map((statusFilter) => (
                        <label key={statusFilter.key} className="flex items-start gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors hover:bg-white/4">
                            <div
                                className="w-4 h-4 mt-0.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                                style={{
                                    borderColor: statusFilter.checked ? COLORS.primary : 'rgba(255,255,255,0.2)',
                                    background: statusFilter.checked ? COLORS.primary : 'transparent',
                                }}
                            >
                                {statusFilter.checked && (
                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={statusFilter.checked}
                                    onChange={statusFilter.onToggle}
                                />
                            </div>
                            <span className="min-w-0">
                                <span className={`block text-sm transition-colors ${statusFilter.checked ? 'text-white' : 'text-white/60 group-hover:text-white/85'}`}>
                                    {statusFilter.label}
                                </span>
                                <span className="block text-[11px] text-white/35 mt-0.5">{statusFilter.description}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Category */}
            <div className="pt-4 border-t border-white/8">
                <SectionLabel><Briefcase className="inline w-3 h-3 mr-1.5 opacity-60" />{copy.category}</SectionLabel>
                <div className="space-y-1">
                    {categoryOptions.map((cat) => {
                        const active = selectedCategories.includes(cat);
                        return (
                            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors hover:bg-white/4">
                                <div
                                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                        borderColor: active ? COLORS.primary : 'rgba(255,255,255,0.2)',
                                        background: active ? COLORS.primary : 'transparent',
                                    }}
                                >
                                    {active && (
                                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    <input type="checkbox" className="sr-only" checked={active}
                                        onChange={() => setSelectedCategories((p) => p.includes(cat) ? p.filter((c) => c !== cat) : [...p, cat])} />
                                </div>
                                <span className={`text-sm transition-colors ${active ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>{cat}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Skills */}
            <div className="pt-4 border-t border-white/8">
                <SectionLabel><Award className="inline w-3 h-3 mr-1.5 opacity-60" />{copy.skills}</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                    {skillOptions.map((skill) => {
                        const active = selectedSkills.includes(skill);
                        return (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => setSelectedSkills((p) => p.includes(skill) ? p.filter((s) => s !== skill) : [...p, skill])}
                                className="rounded-full text-xs font-medium px-3 py-1 transition-all border"
                                style={{
                                    background: active ? COLORS.primaryLight : 'rgba(255,255,255,0.04)',
                                    color: active ? COLORS.primary : 'rgba(255,255,255,0.55)',
                                    borderColor: active ? COLORS.primaryBorder : 'rgba(255,255,255,0.1)',
                                }}
                            >
                                {skill}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hourly rate */}
            <div className="pt-4 border-t border-white/8">
                <SectionLabel>{copy.hourlyRate}</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                        <input
                            type="number"
                            value={rateRange[0]}
                            onChange={(e) => setRateRange([Number(e.target.value), rateRange[1]])}
                            className="w-full rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-sm text-white text-center outline-none focus:border-[var(--workspace-primary,#8b5cf6)] transition-colors"
                        />
                        <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-white/25">min</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={rateRange[1]}
                            onChange={(e) => setRateRange([rateRange[0], Number(e.target.value)])}
                            className="w-full rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-sm text-white text-center outline-none focus:border-[var(--workspace-primary,#8b5cf6)] transition-colors"
                        />
                        <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-white/25">max</span>
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="pt-4 border-t border-white/8">
                <SectionLabel><Star className="inline w-3 h-3 mr-1.5 text-amber-400" />{tx('findFreelancers.rating', undefined, 'Min Rating')}</SectionLabel>
                <div className="grid grid-cols-4 gap-1.5">
                    {[0, 4, 4.5, 4.8].map((r) => {
                        const active = minRating === r;
                        return (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setMinRating(r)}
                                className="rounded-xl py-2 text-xs font-semibold border transition-all"
                                style={{
                                    background: active ? COLORS.primaryLight : 'rgba(255,255,255,0.05)',
                                    color: active ? COLORS.primary : 'rgba(255,255,255,0.55)',
                                    borderColor: active ? COLORS.primaryBorder : 'rgba(255,255,255,0.1)',
                                }}
                            >
                                {r === 0 ? tx('findFreelancers.all', undefined, 'All') : `${r}+`}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Clear */}
            <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/55 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
            >
                {copy.clearFilters}
            </button>
        </div>
    );
}
