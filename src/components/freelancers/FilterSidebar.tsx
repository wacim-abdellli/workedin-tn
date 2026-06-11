import { useState } from 'react';
import { Award, Briefcase, Check, ChevronDown, MapPin, Search, Star, X, Zap, ThumbsUp, Trophy } from 'lucide-react';
import { getLocalizedGovernorateOptions } from '../../lib/governorates';
import { cn } from '../../lib/utils';

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
    // PRO FILTERS
    selectedGovernorates: string[];
    setSelectedGovernorates: React.Dispatch<React.SetStateAction<string[]>>;
    minSuccessRate: number;
    setMinSuccessRate: (v: number) => void;
    minJobsCompleted: number;
    setMinJobsCompleted: (v: number) => void;
    language: any;
}

function AccordionHeader({ label, expanded, onToggle, icon: Icon }: { label: string; expanded: boolean; onToggle: () => void; icon?: React.ComponentType<any> }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-between w-full py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors text-left"
        >
            <span className="flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
                {label}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-white/20 transition-transform duration-300", expanded && "rotate-180")} />
        </button>
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
    // PRO FILTERS
    selectedGovernorates, setSelectedGovernorates,
    minSuccessRate, setMinSuccessRate,
    minJobsCompleted, setMinJobsCompleted,
    language,
}: FilterSidebarProps) {
    // Accordion expand/collapse states
    const [statusExpanded, setStatusExpanded] = useState(true);
    const [locationExpanded, setLocationExpanded] = useState(true);
    const [categoryExpanded, setCategoryExpanded] = useState(true);
    const [skillsExpanded, setSkillsExpanded] = useState(true);
    const [rateExpanded, setRateExpanded] = useState(true);
    const [successExpanded, setSuccessExpanded] = useState(true);
    const [jobsExpanded, setJobsExpanded] = useState(true);
    const [ratingExpanded, setRatingExpanded] = useState(true);

    const [locDropdownOpen, setLocDropdownOpen] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [skillSearch, setSkillSearch] = useState('');

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

    const governorateOptions = getLocalizedGovernorateOptions(language);
    const filteredGovOptions = governorateOptions.filter(gov => gov.label.toLowerCase().includes(locSearch.toLowerCase()));
    const filteredSkillOptions = skillOptions.filter(skill => skill.toLowerCase().includes(skillSearch.toLowerCase()));

    return (
        <div className="space-y-4">
            {/* Search - only shown on mobile/drawer since main page has its own desktop search */}
            <div className="relative lg:hidden mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white bg-white/5 border border-white/8 outline-none focus:border-[var(--workspace-primary,#8b5cf6)] transition-colors placeholder-white/30"
                />
            </div>

            {/* Status Accordion */}
            <div className="border-b border-white/[0.04] pb-2.5">
                <AccordionHeader
                    label={tx('findFreelancers.status', undefined, 'Status')}
                    expanded={statusExpanded}
                    onToggle={() => setStatusExpanded(!statusExpanded)}
                />
                {statusExpanded && (
                    <div className="space-y-1.5 mt-1 animate-fadeIn">
                        {statusFilters.map((statusFilter) => (
                            <label key={statusFilter.key} className="flex items-center justify-between gap-3 cursor-pointer group rounded-xl px-2.5 py-2 transition-all hover:bg-white/4">
                                <span className="min-w-0 leading-tight">
                                    <span className={`block text-xs font-bold transition-colors ${statusFilter.checked ? 'text-white' : 'text-white/60 group-hover:text-white/85'}`}>
                                        {statusFilter.label}
                                    </span>
                                    <span className="block text-[10px] text-white/30 mt-0.5 leading-normal">{statusFilter.description}</span>
                                </span>
                                <div className="relative shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={statusFilter.checked}
                                        onChange={statusFilter.onToggle}
                                    />
                                    <div
                                        className="w-8 h-4.5 rounded-full transition-colors duration-200"
                                        style={{
                                            backgroundColor: statusFilter.checked ? COLORS.primary : 'rgba(255,255,255,0.1)',
                                            boxShadow: statusFilter.checked ? `0 0 8px color-mix(in srgb, ${COLORS.primary} 40%, transparent)` : 'none'
                                        }}
                                    />
                                    <div
                                        className="absolute top-[2px] left-[2px] w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 shadow-sm"
                                        style={{
                                            transform: statusFilter.checked ? 'translateX(14px)' : 'translateX(0)'
                                        }}
                                    />
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Location Accordion */}
            <div className="border-b border-white/[0.04] pb-3">
                <AccordionHeader
                    label={tx('findFreelancers.location', undefined, 'Location')}
                    expanded={locationExpanded}
                    onToggle={() => setLocationExpanded(!locationExpanded)}
                    icon={MapPin}
                />
                {locationExpanded && (
                    <div className="mt-1 animate-fadeIn relative">
                        <button
                            type="button"
                            onClick={() => {
                                setLocDropdownOpen(!locDropdownOpen);
                                setLocSearch(''); // Reset search when toggling
                            }}
                            className="flex items-center justify-between w-full rounded-xl bg-white/4 border border-white/8 px-3.5 py-2.5 text-xs text-white/85 hover:border-white/16 focus:border-[var(--workspace-primary,#8b5cf6)] transition-all"
                        >
                            <span>
                                {selectedGovernorates.length === 0
                                    ? tx('findFreelancers.allLocations', undefined, 'All Locations')
                                    : selectedGovernorates.length === 1
                                        ? (governorateOptions.find(opt => opt.value === selectedGovernorates[0])?.label || selectedGovernorates[0])
                                        : tx('findFreelancers.nLocations', { count: selectedGovernorates.length }, `${selectedGovernorates.length} Locations`)
                                }
                            </span>
                            <ChevronDown className={cn("h-3.5 w-3.5 text-white/30 transition-transform duration-200", locDropdownOpen && "rotate-180")} />
                        </button>

                        {/* Location tags below the button */}
                        {selectedGovernorates.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 animate-fadeIn">
                                {selectedGovernorates.map((govValue) => {
                                    const govLabel = governorateOptions.find(opt => opt.value === govValue)?.label || govValue;
                                    return (
                                        <div
                                            key={govValue}
                                            className="flex items-center gap-1 rounded-lg text-[10px] font-bold px-2 py-0.5 border transition-all"
                                            style={{
                                                background: COLORS.primaryLight,
                                                color: COLORS.primary,
                                                borderColor: COLORS.primaryBorder,
                                            }}
                                        >
                                            <span>{govLabel}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedGovernorates(p => p.filter(v => v !== govValue))}
                                                className="hover:bg-white/10 rounded-sm p-0.5 transition-colors"
                                            >
                                                <X className="w-2.5 h-2.5 text-[var(--workspace-primary,#8b5cf6)]" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {locDropdownOpen && (
                            <>
                                <button
                                    type="button"
                                    className="fixed inset-0 z-40 cursor-default"
                                    onClick={() => setLocDropdownOpen(false)}
                                />
                                <div className="absolute left-0 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#12111a] backdrop-blur-md p-1.5 shadow-2xl z-50 freelancer-scroll">
                                    {/* Search locations box */}
                                    <div className="p-1 border-b border-white/[0.05] sticky top-0 bg-[#12111a] z-10">
                                        <input
                                            type="text"
                                            value={locSearch}
                                            onChange={(e) => setLocSearch(e.target.value)}
                                            placeholder={tx('findFreelancers.searchLocations', undefined, 'Search locations...')}
                                            className="w-full rounded-lg bg-white/4 border border-white/6 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[var(--workspace-primary,#8b5cf6)] placeholder-white/35"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedGovernorates([]);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors mt-1",
                                            selectedGovernorates.length === 0
                                                ? "bg-white/5 text-white font-bold"
                                                : "text-white/60 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <span>{tx('findFreelancers.allLocations', undefined, 'All Locations')}</span>
                                        {selectedGovernorates.length === 0 && (
                                            <Check className="w-3.5 h-3.5 text-[var(--workspace-primary,#8b5cf6)]" />
                                        )}
                                    </button>

                                    {filteredGovOptions.map((gov) => {
                                        const active = selectedGovernorates.includes(gov.value);
                                        return (
                                            <button
                                                key={gov.value}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedGovernorates((prev) => 
                                                        prev.includes(gov.value)
                                                            ? prev.filter((v) => v !== gov.value)
                                                            : [...prev, gov.value]
                                                    );
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors",
                                                    active
                                                        ? "bg-white/5 text-white font-bold"
                                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                <span>{gov.label}</span>
                                                <div
                                                    className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all duration-200"
                                                    style={{
                                                        borderColor: active ? COLORS.primary : 'rgba(255,255,255,0.15)',
                                                        background: active ? COLORS.primary : 'transparent',
                                                    }}
                                                >
                                                    {active && (
                                                        <svg className="w-2 h-2 text-white" viewBox="0 0 10 10" fill="none">
                                                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {filteredGovOptions.length === 0 && (
                                        <div className="px-3 py-4 text-center text-[10px] text-white/30">{tx('findFreelancers.noMatchesFound', undefined, 'No matches found')}</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Category Accordion */}
            <div className="border-b border-white/[0.04] pb-2">
                <AccordionHeader
                    label={copy.category}
                    expanded={categoryExpanded}
                    onToggle={() => setCategoryExpanded(!categoryExpanded)}
                    icon={Briefcase}
                />
                {categoryExpanded && (
                    <div className="space-y-1 mt-1 animate-fadeIn">
                        {categoryOptions.map((cat) => {
                            const active = selectedCategories.includes(cat);
                            return (
                                <label key={cat} className="flex items-center gap-2.5 cursor-pointer group rounded-xl px-2.5 py-1.5 transition-all hover:bg-white/4">
                                    <div
                                        className="w-4.5 h-4.5 rounded-[6px] border flex items-center justify-center shrink-0 transition-all duration-200"
                                        style={{
                                            borderColor: active ? COLORS.primary : 'rgba(255,255,255,0.15)',
                                            background: active ? COLORS.primary : 'transparent',
                                            boxShadow: active ? `0 0 6px color-mix(in srgb, ${COLORS.primary} 30%, transparent)` : 'none'
                                        }}
                                    >
                                        {active && (
                                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                        <input type="checkbox" className="sr-only" checked={active}
                                            onChange={() => setSelectedCategories((p) => p.includes(cat) ? p.filter((c) => c !== cat) : [...p, cat])} />
                                    </div>
                                    <span className={`text-xs font-semibold transition-colors ${active ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>{cat}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Skills Accordion */}
            <div className="border-b border-white/[0.04] pb-3">
                <AccordionHeader
                    label={copy.skills}
                    expanded={skillsExpanded}
                    onToggle={() => setSkillsExpanded(!skillsExpanded)}
                    icon={Award}
                />
                {skillsExpanded && (
                    <div className="mt-1 animate-fadeIn space-y-2">
                        {/* Search skills box */}
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within:text-[var(--workspace-primary,#8b5cf6)] transition-colors pointer-events-none" />
                            <input
                                type="text"
                                value={skillSearch}
                                onChange={(e) => setSkillSearch(e.target.value)}
                                placeholder={tx('findFreelancers.searchSkills', undefined, 'Search skills...')}
                                className="w-full rounded-xl bg-white/4 border border-white/8 ps-8 pe-3 py-1.5 text-xs text-white outline-none focus:border-[var(--workspace-primary,#8b5cf6)] placeholder-white/35"
                            />
                        </div>

                        {/* Active skills tags list */}
                        {selectedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 py-1 border-b border-white/[0.03] pb-2 mb-1 animate-fadeIn">
                                {selectedSkills.map((skill) => (
                                    <div
                                        key={skill}
                                        className="flex items-center gap-1 rounded-lg text-[10px] font-bold px-2 py-0.5 border"
                                        style={{
                                            background: COLORS.primaryLight,
                                            color: COLORS.primary,
                                            borderColor: COLORS.primaryBorder,
                                        }}
                                    >
                                        <span>{skill}</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSkills(p => p.filter(s => s !== skill))}
                                            className="hover:bg-white/10 rounded-sm p-0.5 transition-colors"
                                        >
                                            <X className="w-2.5 h-2.5 text-[var(--workspace-primary,#8b5cf6)]" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto freelancer-scroll pr-1">
                            {filteredSkillOptions.map((skill) => {
                                const active = selectedSkills.includes(skill);
                                return (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => setSelectedSkills((p) => p.includes(skill) ? p.filter((s) => s !== skill) : [...p, skill])}
                                        className="flex items-center gap-1 rounded-lg text-[10px] font-bold px-2.5 py-1 transition-all border"
                                        style={{
                                            background: active ? COLORS.primaryLight : 'rgba(255,255,255,0.03)',
                                            color: active ? COLORS.primary : 'rgba(255,255,255,0.5)',
                                            borderColor: active ? COLORS.primaryBorder : 'rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        {active && <Check className="w-3 h-3 text-[var(--workspace-primary,#8b5cf6)] shrink-0" />}
                                        <span>{skill}</span>
                                    </button>
                                );
                            })}
                            {filteredSkillOptions.length === 0 && (
                                <div className="text-[10px] text-white/30 text-center py-2 w-full">{tx('findFreelancers.noSkillsFound', undefined, 'No skills found')}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Hourly Rate Accordion */}
            <div className="border-b border-white/[0.04] pb-3">
                <AccordionHeader
                    label={copy.hourlyRate}
                    expanded={rateExpanded}
                    onToggle={() => setRateExpanded(!rateExpanded)}
                />
                {rateExpanded && (
                    <div className="mt-1 animate-fadeIn space-y-2">
                        <div className="flex items-center gap-2">
                            {/* Currency inputs (DT prefix) */}
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    value={rateRange[0] || ''}
                                    placeholder={tx('findFreelancers.min', undefined, 'Min')}
                                    onChange={(e) => setRateRange([Number(e.target.value), rateRange[1]])}
                                    className="w-full rounded-xl bg-white/4 border border-white/10 ps-7 pe-3 py-2 text-xs text-white outline-none focus:border-[var(--workspace-primary,#8b5cf6)] focus:bg-white/[0.06] transition-all"
                                />
                                <span className="absolute inset-inline-start-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/25 pointer-events-none">DT</span>
                            </div>
                            <span className="text-white/20 text-xs">{tx('findFreelancers.to', undefined, 'to')}</span>
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    value={rateRange[1] || ''}
                                    placeholder={tx('findFreelancers.max', undefined, 'Max')}
                                    onChange={(e) => setRateRange([rateRange[0], Number(e.target.value)])}
                                    className="w-full rounded-xl bg-white/4 border border-white/10 ps-7 pe-3 py-2 text-xs text-white outline-none focus:border-[var(--workspace-primary,#8b5cf6)] focus:bg-white/[0.06] transition-all"
                                />
                                <span className="absolute inset-inline-start-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/25 pointer-events-none">DT</span>
                            </div>
                        </div>

                        {/* Rate Presets */}
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/[0.03]">
                            {[
                                { label: tx('findFreelancers.rateAny', undefined, 'Any'), min: 0, max: 100 },
                                { label: '< 20 DT', min: 0, max: 20 },
                                { label: '20-50 DT', min: 20, max: 50 },
                                { label: '50+ DT', min: 50, max: 100 },
                            ].map((preset) => {
                                const active = rateRange[0] === preset.min && rateRange[1] === preset.max;
                                return (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => setRateRange([preset.min, preset.max])}
                                        className="rounded-lg text-[9px] font-bold px-2 py-1 transition-all border shrink-0"
                                        style={{
                                            background: active ? COLORS.primaryLight : 'rgba(255,255,255,0.03)',
                                            color: active ? COLORS.primary : 'rgba(255,255,255,0.45)',
                                            borderColor: active ? COLORS.primaryBorder : 'rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Job Success Rate Accordion */}
            <div className="border-b border-white/[0.04] pb-2">
                <AccordionHeader
                    label={tx('findFreelancers.jobSuccessRate', undefined, 'Job Success Rate')}
                    expanded={successExpanded}
                    onToggle={() => setSuccessExpanded(!successExpanded)}
                />
                {successExpanded && (
                    <div className="space-y-1.5 mt-1 animate-fadeIn">
                        {[
                            { label: tx('findFreelancers.anySuccessRate', undefined, 'Any Success Rate'), value: 0, desc: tx('findFreelancers.anySuccessRateDesc', undefined, 'Show all freelancers'), icon: Trophy },
                            { label: tx('findFreelancers.rate90up', undefined, '90% & up'), value: 90, desc: tx('findFreelancers.rate90upDesc', undefined, 'Highly rated professionals'), icon: Zap },
                            { label: tx('findFreelancers.rate80up', undefined, '80% & up'), value: 80, desc: tx('findFreelancers.rate80upDesc', undefined, 'Top tier consistency'), icon: ThumbsUp },
                        ].map((opt) => {
                            const active = minSuccessRate === opt.value;
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setMinSuccessRate(opt.value)}
                                    className="w-full flex items-start gap-3 rounded-xl px-3 py-2 text-left border transition-all duration-200"
                                    style={{
                                        background: active ? COLORS.primaryLight : 'rgba(255,255,255,0.02)',
                                        borderColor: active ? COLORS.primary : 'rgba(255,255,255,0.06)',
                                        boxShadow: active ? `0 0 10px color-mix(in srgb, ${COLORS.primary} 15%, transparent)` : 'none'
                                    }}
                                >
                                    <div className="mt-0.5 p-1 rounded-lg bg-white/5 border border-white/5 text-white/55 shrink-0"
                                         style={{ color: active ? 'var(--workspace-primary,#8b5cf6)' : undefined }}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0 leading-tight">
                                        <span className={cn("block text-xs font-bold transition-colors", active ? "text-white" : "text-white/60")}>{opt.label}</span>
                                        <span className="block text-[9px] text-white/30 mt-0.5 leading-normal">{opt.desc}</span>
                                    </div>
                                    <div className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 mt-0.5 transition-all"
                                         style={{ 
                                             borderColor: active ? COLORS.primary : undefined,
                                             background: active ? COLORS.primary : undefined
                                         }}>
                                        {active && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Jobs Completed Accordion */}
            <div className="border-b border-white/[0.04] pb-2">
                <AccordionHeader
                    label={tx('findFreelancers.jobsCompleted', undefined, 'Jobs Completed')}
                    expanded={jobsExpanded}
                    onToggle={() => setJobsExpanded(!jobsExpanded)}
                />
                {jobsExpanded && (
                    <div className="space-y-1.5 mt-1 animate-fadeIn">
                        {[
                            { label: tx('findFreelancers.anyJobsAmount', undefined, 'Any Jobs Amount'), value: 0, desc: tx('findFreelancers.anyJobsAmountDesc', undefined, 'Show everyone'), icon: Briefcase },
                            { label: tx('findFreelancers.jobs1plus', undefined, '1+ jobs completed'), value: 1, desc: tx('findFreelancers.jobs1plusDesc', undefined, 'Has marketplace experience'), icon: Check },
                            { label: tx('findFreelancers.jobs5plus', undefined, '5+ jobs completed'), value: 5, desc: tx('findFreelancers.jobs5plusDesc', undefined, 'Established track record'), icon: Award },
                            { label: tx('findFreelancers.jobs10plus', undefined, '10+ jobs completed'), value: 10, desc: tx('findFreelancers.jobs10plusDesc', undefined, 'Veteran freelancer status'), icon: Trophy },
                        ].map((opt) => {
                            const active = minJobsCompleted === opt.value;
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setMinJobsCompleted(opt.value)}
                                    className="w-full flex items-start gap-3 rounded-xl px-3 py-2 text-left border transition-all duration-200"
                                    style={{
                                        background: active ? COLORS.primaryLight : 'rgba(255,255,255,0.02)',
                                        borderColor: active ? COLORS.primary : 'rgba(255,255,255,0.06)',
                                        boxShadow: active ? `0 0 10px color-mix(in srgb, ${COLORS.primary} 15%, transparent)` : 'none'
                                    }}
                                >
                                    <div className="mt-0.5 p-1 rounded-lg bg-white/5 border border-white/5 text-white/55 shrink-0"
                                         style={{ color: active ? 'var(--workspace-primary,#8b5cf6)' : undefined }}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0 leading-tight">
                                        <span className={cn("block text-xs font-bold transition-colors", active ? "text-white" : "text-white/60")}>{opt.label}</span>
                                        <span className="block text-[9px] text-white/30 mt-0.5 leading-normal">{opt.desc}</span>
                                    </div>
                                    <div className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 mt-0.5 transition-all"
                                         style={{ 
                                             borderColor: active ? COLORS.primary : undefined,
                                             background: active ? COLORS.primary : undefined
                                         }}>
                                        {active && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Rating Accordion */}
            <div className="border-b border-white/[0.04] pb-3">
                <AccordionHeader
                    label={tx('findFreelancers.rating', undefined, 'Min Rating')}
                    expanded={ratingExpanded}
                    onToggle={() => setRatingExpanded(!ratingExpanded)}
                    icon={Star}
                />
                {ratingExpanded && (
                    <div className="mt-1 animate-fadeIn">
                        <div className="flex rounded-xl bg-white/4 border border-white/[0.05] p-1 shadow-inner relative z-0">
                            {[0, 4, 4.5, 4.8].map((r) => {
                                const active = minRating === r;
                                return (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setMinRating(r)}
                                        className={cn(
                                            "flex-1 rounded-lg py-1.5 text-[10px] font-extrabold transition-all duration-200 hover:text-white relative z-10",
                                            active ? "text-white" : "text-white/45 hover:bg-white/5"
                                        )}
                                        style={{
                                            background: active ? 'var(--workspace-primary,#8b5cf6)' : 'transparent',
                                            boxShadow: active ? '0 2px 8px rgba(139,92,246,0.3)' : 'none',
                                        }}
                                    >
                                        {r === 0 ? tx('findFreelancers.all', undefined, 'All') : `${r} ★`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Clear Link */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full text-center py-2 text-xs font-bold text-white/40 hover:text-[var(--workspace-primary,#8b5cf6)] transition-colors hover:underline"
                >
                    {copy.clearFilters}
                </button>
            </div>
        </div>
    );
}
