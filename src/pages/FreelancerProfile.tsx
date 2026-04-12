import {
    MapPin,
    Star,
    Target,
    Briefcase,
    Wallet,
    Clock,
    Coins,
    Check,
    CheckCircle,
    Circle,
    Plus,
    Edit2,
    Settings,
    MessageSquare,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { localizeGovernorate } from '../lib/governorates';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';
import ContactModal from '../components/freelancer/ContactModal';
import type {
    FreelancerData,
    FreelancerProfilePublicRow,
    FreelancerReviewRow,
    FreelancerSkillValue,
    FreelancerUsernameLookupRow,
    PortfolioItemRow,
} from '../types/freelancer';
import { PREDEFINED_SKILLS, PREDEFINED_TOOLS } from '@/types';

interface ProfilePageProps {
    // 'owner': The freelancer viewing their own profile
    // 'client': A business/client looking to hire
    // 'freelancer': A different freelancer browsing the platform
    // 'guest': Not logged in
    viewerRole: 'owner' | 'client' | 'freelancer' | 'guest';
}

function getFreelancerSkillName(skillValue: FreelancerSkillValue): string {
    if (typeof skillValue === 'string') {
        return skillValue;
    }

    return typeof skillValue?.name === 'string' ? skillValue.name : '';
}

function getSingleReviewer(reviewer: FreelancerReviewRow['reviewer']) {
    return Array.isArray(reviewer) ? (reviewer[0] ?? null) : reviewer;
}

function getReviewJobTitle(contract: FreelancerReviewRow['contract']): string | null {
    const contractRow = Array.isArray(contract) ? contract[0] : contract;
    const job = contractRow?.job;
    const jobRow = Array.isArray(job) ? job[0] : job;

    return jobRow?.title || null;
}

function SectionLabel({
    title,
    viewerRole,
    isEditing,
    onEdit,
    onCancel,
}: {
    title: string;
    viewerRole: ProfilePageProps['viewerRole'];
    isEditing?: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
}) {

    return (
        <div className="flex items-center justify-between mb-4">
            <span className="uppercase text-xs font-bold text-gray-500 tracking-wider">{title}</span>
            {viewerRole === 'owner' ? (
                <button
                    onClick={isEditing ? onCancel : onEdit}
                    className="inline-flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-xs">{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
            ) : null}
        </div>
    );
}

function EmptyStars() {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className="w-4 h-4 text-gray-600" />
            ))}
        </div>
    );
}

interface PickerOption {
    id: string;
    name: string;
    category: string;
}

function toCategoryLabel(value: string): string {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

function getFreelancerIntro(projectPreferences: unknown, fallbackBio: string | null | undefined): string {
    const preferences = toRecord(projectPreferences);
    const intro = preferences.bio;

    if (typeof intro === 'string' && intro.trim().length > 0) {
        return intro.trim();
    }

    return fallbackBio?.trim() || '';
}

function CompactMultiSelectEditor({
    title,
    searchQuery,
    onSearchChange,
    options,
    selectedValues,
    onToggle,
    accentColor,
    maxSelected,
}: {
    title: string;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    options: PickerOption[];
    selectedValues: string[];
    onToggle: (value: string) => void;
    accentColor: string;
    maxSelected: number;
}) {
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const categories = useMemo(() => {
        const values = Array.from(new Set(options.map((option) => option.category)));
        return ['all', ...values];
    }, [options]);

    const filteredOptions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return options.filter((option) => {
            const matchesCategory = activeCategory === 'all' || option.category === activeCategory;
            const matchesSearch = !query || option.name.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, options, searchQuery]);

    return (
        <div className="mt-3 rounded-xl border border-[#262626] bg-[#0a0a0a] p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={`Search ${title.toLowerCase()}...`}
                    className="flex-1 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white p-2.5 outline-none transition-all"
                />
                <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border w-fit"
                    style={{
                        borderColor: `color-mix(in srgb, ${accentColor} 35%, #262626)`,
                        background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                        color: accentColor,
                    }}
                >
                    {selectedValues.length}/{maxSelected}
                </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => {
                    const isActive = category === activeCategory;
                    return (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className="px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-colors"
                            style={{
                                borderColor: isActive
                                    ? `color-mix(in srgb, ${accentColor} 45%, #262626)`
                                    : '#262626',
                                background: isActive
                                    ? `color-mix(in srgb, ${accentColor} 12%, transparent)`
                                    : '#141414',
                                color: isActive ? accentColor : '#9ca3af',
                            }}
                        >
                            {category === 'all' ? 'All' : toCategoryLabel(category)}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3">
                <div className="border border-[#262626] rounded-xl p-2 bg-[#111111] max-h-56 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredOptions.map((option) => {
                            const isSelected = selectedValues.includes(option.name);

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onToggle(option.name)}
                                    className="w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between"
                                    style={{
                                        borderColor: isSelected
                                            ? `color-mix(in srgb, ${accentColor} 45%, transparent)`
                                            : '#262626',
                                        background: isSelected
                                            ? `color-mix(in srgb, ${accentColor} 14%, transparent)`
                                            : '#141414',
                                        color: isSelected ? accentColor : '#e5e7eb',
                                    }}
                                >
                                    <span className="text-sm font-medium">{option.name}</span>
                                    {isSelected ? <Check className="w-4 h-4" /> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="border border-[#262626] rounded-xl p-2 bg-[#111111] max-h-56 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Selected {title}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedValues.length === 0 ? (
                            <p className="text-xs text-gray-500">No {title.toLowerCase()} selected.</p>
                        ) : (
                            selectedValues.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => onToggle(value)}
                                    className="text-xs px-2 py-1 rounded-full border"
                                    style={{
                                        borderColor: `color-mix(in srgb, ${accentColor} 40%, #262626)`,
                                        color: accentColor,
                                        background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                                    }}
                                >
                                    {value}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileView({
    viewerRole,
    freelancer,
    onOpenContact,
    onSaveBio,
    onSaveSkills,
    onSaveTools,
}: ProfilePageProps & {
    freelancer: FreelancerData;
    onOpenContact: () => void;
    onSaveBio: (bio: string) => Promise<void>;
    onSaveSkills: (skills: string[]) => Promise<void>;
    onSaveTools: (tools: string[]) => Promise<void>;
}) {
    const navigate = useNavigate();

    const [editingBio, setEditingBio] = useState(false);
    const [editingSkills, setEditingSkills] = useState(false);
    const [editingTools, setEditingTools] = useState(false);

    const [bioDraft, setBioDraft] = useState(freelancer.bio || '');
    const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>([]);
    const [selectedToolNames, setSelectedToolNames] = useState<string[]>([]);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [toolSearchQuery, setToolSearchQuery] = useState('');

    const [savingBio, setSavingBio] = useState(false);
    const [savingSkills, setSavingSkills] = useState(false);
    const [savingTools, setSavingTools] = useState(false);

    useEffect(() => {
        setBioDraft(freelancer.bio || '');
    }, [freelancer.bio]);

    useEffect(() => {
        setSelectedSkillNames(freelancer.skills.map((skill) => skill.name_en).filter(Boolean));
    }, [freelancer.skills]);

    useEffect(() => {
        setSelectedToolNames(freelancer.tools);
    }, [freelancer.tools]);

    const strengths = freelancer.skills.length > 0
        ? freelancer.skills.map((skill) => skill.name_en).filter(Boolean)
        : ['Web Development', 'Web Research'];

    const tools = freelancer.tools.length > 0
        ? freelancer.tools
        : ['Figma', 'Canva', 'VS Code', 'Docker', 'Vercel', 'MongoDB'];

    const reviewBuckets = [5, 4, 3, 2, 1].map((score) => {
        const total = freelancer.stats.reviews_count || 0;
        const count = freelancer.reviews.filter((r) => Math.round(r.rating) === score).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return { score, pct };
    });

    const accentColor = viewerRole === 'client' ? '#F59E0B' : '#8B5CF6';

    const skillPickerOptions = useMemo<PickerOption[]>(() => {
        return PREDEFINED_SKILLS.map((skill) => ({
            id: skill.id,
            name: skill.name_en,
            category: skill.category,
        }));
    }, []);

    const toolPickerOptions = useMemo<PickerOption[]>(() => {
        return PREDEFINED_TOOLS.map((tool) => ({
            id: tool.id,
            name: tool.name_en,
            category: tool.category,
        }));
    }, []);

    const toggleSkillOption = (skillName: string) => {
        setSelectedSkillNames((prev) => {
            if (prev.includes(skillName)) {
                return prev.filter((item) => item !== skillName);
            }

            if (prev.length >= 15) {
                return prev;
            }

            return [...prev, skillName];
        });
    };

    const toggleToolOption = (toolName: string) => {
        setSelectedToolNames((prev) => {
            if (prev.includes(toolName)) {
                return prev.filter((item) => item !== toolName);
            }

            if (prev.length >= 15) {
                return prev;
            }

            return [...prev, toolName];
        });
    };

    const saveBio = async () => {
        try {
            setSavingBio(true);
            await onSaveBio(bioDraft);
            setEditingBio(false);
        } finally {
            setSavingBio(false);
        }
    };

    const saveSkills = async () => {
        try {
            setSavingSkills(true);
            await onSaveSkills(selectedSkillNames);
            setEditingSkills(false);
        } finally {
            setSavingSkills(false);
        }
    };

    const saveTools = async () => {
        try {
            setSavingTools(true);
            await onSaveTools(selectedToolNames);
            setEditingTools(false);
        } finally {
            setSavingTools(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img
                                    src={freelancer.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=192&h=192&fit=crop&crop=face'}
                                    alt="user"
                                    className="w-24 h-24 rounded-full border-2 border-[#262626] object-cover"
                                />
                                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-[#141414]" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold">{freelancer.full_name || 'user'}</h1>
                                <p className="text-gray-400 mt-1">{freelancer.title || 'developer'}</p>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span
                                        className="px-3 py-1 rounded-full border text-xs font-semibold"
                                        style={{
                                            background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                                            color: accentColor,
                                            borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                                        }}
                                    >
                                        Freelancer
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">
                                        Available
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-3">
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {freelancer.location || 'Ariana'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Star className="w-4 h-4" />
                                        {freelancer.stats.rating.toFixed(1)} - {freelancer.stats.reviews_count} reviews
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Target className="w-4 h-4" />
                                        {freelancer.stats.success_rate}% success
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <SectionLabel
                            title="INTRODUCTION"
                            viewerRole={viewerRole}
                            isEditing={editingBio}
                            onEdit={() => setEditingBio(true)}
                            onCancel={() => {
                                setBioDraft(freelancer.bio || '');
                                setEditingBio(false);
                            }}
                        />
                        {editingBio && viewerRole === 'owner' ? (
                            <>
                                <textarea
                                    rows={4}
                                    value={bioDraft}
                                    onChange={(event) => setBioDraft(event.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg text-white p-3 outline-none transition-all"
                                    style={{
                                        borderColor: '#262626',
                                        boxShadow: 'none',
                                    }}
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="button"
                                        onClick={saveBio}
                                        disabled={savingBio}
                                        className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-70"
                                        style={{ background: accentColor }}
                                    >
                                        {savingBio ? 'Saving...' : 'Save bio'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-300">{freelancer.bio || 'No bio added yet'}</p>
                        )}
                    </section>

                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <SectionLabel
                            title="CORE STRENGTHS"
                            viewerRole={viewerRole}
                            isEditing={editingSkills}
                            onEdit={() => setEditingSkills(true)}
                            onCancel={() => {
                                setSelectedSkillNames(freelancer.skills.map((skill) => skill.name_en).filter(Boolean));
                                setSkillSearchQuery('');
                                setEditingSkills(false);
                            }}
                        />
                        {editingSkills && viewerRole === 'owner' ? (
                            <>
                                <CompactMultiSelectEditor
                                    title="Skills"
                                    searchQuery={skillSearchQuery}
                                    onSearchChange={setSkillSearchQuery}
                                    options={skillPickerOptions}
                                    selectedValues={selectedSkillNames}
                                    onToggle={toggleSkillOption}
                                    accentColor={accentColor}
                                    maxSelected={15}
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="button"
                                        onClick={saveSkills}
                                        disabled={savingSkills || selectedSkillNames.length === 0}
                                        className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-70"
                                        style={{ background: accentColor }}
                                    >
                                        {savingSkills ? 'Saving...' : 'Save skills'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {strengths.map((item) => (
                                    <span
                                        key={item}
                                        className="px-4 py-1.5 rounded-full border text-sm"
                                        style={{
                                            background: `color-mix(in srgb, ${accentColor} 9%, transparent)`,
                                            color: accentColor,
                                            borderColor: `color-mix(in srgb, ${accentColor} 24%, transparent)`,
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <SectionLabel
                            title="TOOLS"
                            viewerRole={viewerRole}
                            isEditing={editingTools}
                            onEdit={() => setEditingTools(true)}
                            onCancel={() => {
                                setSelectedToolNames(freelancer.tools);
                                setToolSearchQuery('');
                                setEditingTools(false);
                            }}
                        />
                        {editingTools && viewerRole === 'owner' ? (
                            <>
                                <CompactMultiSelectEditor
                                    title="Tools"
                                    searchQuery={toolSearchQuery}
                                    onSearchChange={setToolSearchQuery}
                                    options={toolPickerOptions}
                                    selectedValues={selectedToolNames}
                                    onToggle={toggleToolOption}
                                    accentColor={accentColor}
                                    maxSelected={15}
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="button"
                                        onClick={saveTools}
                                        disabled={savingTools || selectedToolNames.length === 0}
                                        className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-70"
                                        style={{ background: accentColor }}
                                    >
                                        {savingTools ? 'Saving...' : 'Save tools'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {tools.map((item) => (
                                    <span
                                        key={item}
                                        className="px-4 py-1.5 rounded-full border text-sm"
                                        style={{
                                            background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                                            color: accentColor,
                                            borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="uppercase text-xs font-bold text-gray-500 tracking-wider">SELECTED WORK</span>
                            <span className="bg-[#262626] px-2 py-0.5 rounded text-xs">{freelancer.work_samples.length} works</span>
                        </div>

                        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#262626] rounded-xl text-center">
                            <Briefcase className="w-12 h-12 text-gray-600" />
                            <p className="text-lg font-medium mt-4">
                                {freelancer.work_samples.length > 0 ? 'Portfolio available' : 'No work samples added yet'}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Showcase case studies, shipped products, and measurable outcomes.
                            </p>
                            {viewerRole === 'owner' ? (
                                <button
                                    onClick={() => navigate(ROUTES.freelancerPortfolio)}
                                    className="mt-4 inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm">Add your first work sample</span>
                                </button>
                            ) : null}
                        </div>
                    </section>

                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <h3 className="text-sm font-semibold tracking-wide">CLIENT TRUST - Reviews & work history</h3>

                        <div className="flex flex-col md:flex-row gap-8 items-center mt-6">
                            <div className="text-center">
                                <p className="text-5xl font-bold">{freelancer.stats.rating.toFixed(1)}</p>
                                <div className="mt-2">
                                    <EmptyStars />
                                </div>
                                <p className="text-gray-500 text-sm mt-2">{freelancer.stats.reviews_count} reviews</p>
                            </div>

                            <div className="space-y-2 w-full max-w-md">
                                {reviewBuckets.map(({ score, pct }) => (
                                    <div key={score} className="flex items-center gap-2">
                                        <span className="w-3 text-xs text-gray-400">{score}</span>
                                        <div className="h-2 w-48 bg-[#262626] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accentColor }} />
                                        </div>
                                        <span className="text-xs text-gray-500">{pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 text-center w-full block mt-6">
                            No reviews yet - complete your first contract to receive feedback.
                        </p>
                    </section>
                </div>

                <aside className="lg:col-span-1 flex flex-col gap-6">
                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <div className="flex flex-col gap-3 w-full">
                            {viewerRole === 'owner' ? (
                                <button
                                    onClick={() => setEditingBio(true)}
                                    className="w-full text-white rounded-xl py-3 font-semibold transition-colors"
                                    style={{ background: accentColor }}
                                >
                                    Edit Bio
                                </button>
                            ) : null}

                            {viewerRole === 'owner' ? (
                                <button
                                    onClick={() => navigate(ROUTES.freelancerPortfolio)}
                                    className="w-full bg-[#262626] text-white rounded-xl py-3 font-semibold transition-colors hover:bg-[#303030]"
                                >
                                    Add Portfolio
                                </button>
                            ) : null}

                            {viewerRole === 'owner' ? (
                                <button
                                    onClick={() => navigate(ROUTES.settings)}
                                    className="w-full border border-[#262626] text-gray-300 rounded-xl py-3 font-semibold transition-colors hover:text-white inline-flex items-center justify-center gap-2"
                                    style={{ borderColor: `color-mix(in srgb, ${accentColor} 45%, #262626)` }}
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                            ) : null}

                            {viewerRole === 'client' ? (
                                <button
                                    onClick={onOpenContact}
                                    className="w-full text-white rounded-xl py-3 font-semibold transition-colors"
                                    style={{ background: accentColor }}
                                >
                                    Hire Me
                                </button>
                            ) : null}

                            {viewerRole === 'client' ? (
                                <button
                                    onClick={onOpenContact}
                                    className="w-full bg-transparent rounded-xl py-3 font-semibold transition-colors inline-flex items-center justify-center gap-2"
                                    style={{
                                        border: `1px solid ${accentColor}`,
                                        color: accentColor,
                                        background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                                    }}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Message
                                </button>
                            ) : null}

                            {(viewerRole === 'freelancer' || viewerRole === 'guest') ? (
                                <button
                                    onClick={onOpenContact}
                                    className="w-full bg-transparent border border-[#262626] text-gray-300 rounded-xl py-3 font-semibold transition-colors hover:text-white inline-flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Message
                                </button>
                            ) : null}
                        </div>

                        <div className={`mt-5 ${viewerRole === 'owner' ? '' : 'invisible'}`}>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span>Profile strength</span>
                                <span>{freelancer.stats.success_rate}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#262626] rounded-full overflow-hidden">
                                <div className="h-full" style={{ width: `${freelancer.stats.success_rate}%`, background: accentColor }} />
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-2 gap-3">
                        <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl flex flex-col">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="text-xl font-bold mt-2">{freelancer.stats.jobs_completed}</span>
                            <span className="text-xs text-gray-400 mt-1">Completed</span>
                        </div>
                        <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl flex flex-col">
                            <Wallet className="w-4 h-4 text-gray-400" />
                            <span className="text-xl font-bold mt-2">{freelancer.stats.total_earnings.toLocaleString()} TND</span>
                            <span className="text-xs text-gray-400 mt-1">Earned</span>
                        </div>
                        <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl flex flex-col">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xl font-bold mt-2">
                                {freelancer.stats.response_time_hours}h <span className="text-green-500 text-xs font-medium">Fast</span>
                            </span>
                            <span className="text-xs text-gray-400 mt-1">Response</span>
                        </div>
                        <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl flex flex-col">
                            <Coins className="w-4 h-4 text-gray-400" />
                            <span className="text-xl font-bold mt-2">{freelancer.hourly_rate} TND/h</span>
                            <span className="text-xs text-gray-400 mt-1">Hourly rate</span>
                        </div>
                    </section>

                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-gray-300" />
                            <h3 className="font-semibold">Work information</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Status</span>
                                <span className="text-green-500">{freelancer.availability === 'available' ? 'Available for work' : freelancer.availability}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Member since</span>
                                <span className="text-white">{new Date(freelancer.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Last seen</span>
                                <span className="text-green-500">Recently</span>
                            </div>
                        </div>
                    </section>

                    <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-gray-300" />
                            <h3 className="font-semibold">Verifications</h3>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-3 text-sm text-gray-300 py-1.5">
                                {freelancer.verifications.cin ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
                                <span>Identity</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300 py-1.5">
                                {freelancer.verifications.phone ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
                                <span>Phone</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300 py-1.5">
                                {freelancer.verifications.email ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
                                <span>Email</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300 py-1.5">
                                {freelancer.verifications.payment ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
                                <span>Payment method</span>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

export default function FreelancerProfile() {
    const { usernameOrId } = useParams<{ usernameOrId: string }>();
    const { language, t, tx } = useTranslation();
    const { user, profile, activeMode } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.id || activeMode !== 'client' || !usernameOrId) {
            return;
        }

        const metadataUsername = typeof user.user_metadata?.username === 'string'
            ? user.user_metadata.username
            : undefined;

        const isOwnFreelancerRoute =
            usernameOrId === user.id ||
            usernameOrId === profile?.username ||
            usernameOrId === metadataUsername;

        if (isOwnFreelancerRoute) {
            navigate(`/client/${user.id}`, { replace: true });
        }
    }, [activeMode, navigate, profile?.username, user?.id, user?.user_metadata?.username, usernameOrId]);

    // Use refs so loadFreelancer doesn't re-run on language change
    const languageRef = useRef(language);
    const tRef = useRef(t);
    const txRef = useRef(tx);
    useEffect(() => { languageRef.current = language; }, [language]);
    useEffect(() => { tRef.current = t; }, [t]);
    useEffect(() => { txRef.current = tx; }, [tx]);

    // Seed from sessionStorage cache for instant render
    const getCached = (id: string): FreelancerData | null => {
        try {
            const raw = sessionStorage.getItem(`fp_cache_${id}`);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    };
    const setCache = (id: string, data: FreelancerData) => {
        try { sessionStorage.setItem(`fp_cache_${id}`, JSON.stringify(data)); } catch { /* ignore */ }
    };

    const [freelancer, setFreelancer] = useState<FreelancerData | null>(() => {
        if (!usernameOrId) return null;
        return getCached(usernameOrId);
    });
    const [isLoading, setIsLoading] = useState(!freelancer); // skip loading if cache hit
    const [resolvedProfileId, setResolvedProfileId] = useState<string | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);

    const saveBio = useCallback(async (bio: string) => {
        if (!user?.id) {
            return;
        }

        const normalizedBio = bio.trim();
        const currentPreferences = toRecord(freelancer?.project_preferences);
        const nextPreferences: Record<string, unknown> = {
            ...currentPreferences,
        };

        if (normalizedBio) {
            nextPreferences.bio = normalizedBio;
        } else {
            delete nextPreferences.bio;
        }

        const { error } = await supabase
            .from('freelancer_profiles')
            .update({ project_preferences: nextPreferences })
            .eq('id', user.id);

        if (error) {
            logger.error('Error updating profile bio', error);
            throw error;
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                bio: normalizedBio,
                project_preferences: nextPreferences,
            };
        });
    }, [freelancer?.project_preferences, user?.id]);

    const saveSkills = useCallback(async (skillNames: string[]) => {
        if (!user?.id) {
            return;
        }

        const skillEntries = skillNames.map((name) => ({
            name,
            name_en: name,
            name_ar: name,
            name_fr: name,
        }));

        const { error } = await supabase
            .from('freelancer_profiles')
            .update({ skills: skillEntries })
            .eq('id', user.id);

        if (error) {
            logger.error('Error updating freelancer skills', error);
            throw error;
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                skills: skillNames.map((name, index) => ({
                    id: `${name}-${index}`,
                    name_en: name,
                    name_ar: name,
                    name_fr: name,
                })),
            };
        });
    }, [user?.id]);

    const saveTools = useCallback(async (toolNames: string[]) => {
        if (!user?.id) {
            return;
        }

        const { error } = await supabase
            .from('freelancer_profiles')
            .update({ tools: toolNames })
            .eq('id', user.id);

        if (error) {
            logger.error('Error updating freelancer tools', error);
            throw error;
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                tools: toolNames,
            };
        });
    }, [user?.id]);

    const loadFreelancer = useCallback(async (showLoader = true) => {
            if (showLoader) {
                setIsLoading(true);
            }

            if (!usernameOrId) {
                setFreelancer(null);
                setResolvedProfileId(null);
                if (showLoader) {
                    setIsLoading(false);
                }
                return;
            }

            try {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
                let profileId = usernameOrId;

                if (!isUUID) {
                    const { data: userProfile, error: userError } = await supabase
                        .from('public_profiles')
                        .select('id')
                        .eq('username', usernameOrId)
                        .single();

                    const userProfileRow = userProfile as FreelancerUsernameLookupRow | null;
                    if (userError || !userProfileRow) throw new Error('User not found');
                    profileId = userProfileRow.id;
                }

                setResolvedProfileId(profileId);

                const [{ data: profileData, error: profileError }, { data: portfolioItems }, { data: reviews }] = await Promise.all([
                    supabase
                        .from('freelancer_profiles')
                        .select(`
                            *,
                            profile:public_profiles!id (
                                full_name,
                                username,
                                avatar_url,
                                bio,
                                location,
                                created_at,
                                user_type
                            )
                        `)
                        .eq('id', profileId)
                        .single(),
                    supabase
                        .from('portfolio_items')
                        .select('*')
                        .eq('freelancer_id', profileId)
                        .order('order_index', { ascending: true }),
                    supabase
                        .from('reviews')
                        .select(`
                            id,
                            rating,
                            comment,
                            created_at,
                            skills_rating,
                            reviewer:public_profiles!reviewer_id (
                                full_name,
                                avatar_url
                            ),
                            contract:contracts!contract_id (
                                job:jobs (
                                    title
                                )
                            )
                        `)
                        .eq('reviewee_id', profileId)
                        .order('created_at', { ascending: false }),
                ]);

                const profileRow = profileData as FreelancerProfilePublicRow | null;
                if (profileError || !profileRow?.profile) throw profileError || new Error('Freelancer not found');

                const rawSkills: FreelancerSkillValue[] = Array.isArray(profileRow.skills) ? profileRow.skills : [];
                const skills = rawSkills.map((skillValue, index) => {
                    const skillName = getFreelancerSkillName(skillValue);
                    return {
                        id: skillName || String(index),
                        name_en: skillName,
                        name_ar: skillName,
                        name_fr: skillName,
                    };
                });

                const portfolioRows = (portfolioItems ?? []) as PortfolioItemRow[];
                const reviewRows = (reviews ?? []) as FreelancerReviewRow[];

                const stats = {
                    jobs_completed: profileRow.jobs_completed || 0,
                    rating: profileRow.success_rate ? profileRow.success_rate / 20 : 0,
                    reviews_count: reviewRows.length,
                    response_time_hours: profileRow.response_time_hours || 24,
                    completion_rate: 100,
                    repeat_clients: profileRow.repeat_clients || 0,
                    total_earnings: profileRow.total_earnings || 0,
                    success_rate: profileRow.success_rate || 0,
                    profile_views: profileRow.profile_views || 0,
                };

                const formattedData: FreelancerData = {
                    id: profileRow.id,
                    full_name: profileRow.profile.full_name,
                    username: profileRow.profile.username || undefined,
                    title: profileRow.title,
                    avatar_url: profileRow.profile.avatar_url,
                    bio: getFreelancerIntro(profileRow.project_preferences, profileRow.profile.bio),
                    location: profileRow.profile.location
                        ? localizeGovernorate(profileRow.profile.location, languageRef.current)
                        : tRef.current.footer?.city || 'Tunis, Tunisia',
                    joined_at: profileRow.profile.created_at,
                    voice_intro_url: profileRow.voice_intro_url,
                    hourly_rate: profileRow.hourly_rate || 0,
                    availability: profileRow.availability || 'available',
                    skills,
                    tools: Array.isArray(profileRow.tools) ? profileRow.tools : [],
                    languages: Array.isArray(profileRow.languages) ? profileRow.languages : [],
                    education: Array.isArray(profileRow.education) ? profileRow.education : [],
                    certifications: Array.isArray(profileRow.certifications) ? profileRow.certifications : [],
                    project_preferences: toRecord(profileRow.project_preferences),
                    stats,
                    verifications: {
                        cin: profileRow.cin_verified || false,
                        phone: (profileRow as { phone_verified?: boolean }).phone_verified || false,
                        email: true,
                        payment: false,
                    },
                    work_samples: portfolioRows.map((item) => ({
                        id: item.id,
                        title: item.title || '',
                        thumbnail_url: item.thumbnail_url || item.media_urls?.[0] || '',
                        description: item.description || undefined,
                        project_url: item.project_url || undefined,
                        skills_used: item.skills_used || undefined,
                        media_urls: item.media_urls || undefined,
                    })),
                    reviews: reviewRows.map((review) => {
                        const reviewer = getSingleReviewer(review.reviewer);

                        return {
                            id: review.id,
                            client_name: reviewer?.full_name || tRef.current.reviews?.client || 'Client',
                            client_avatar: reviewer?.avatar_url || undefined,
                            rating: review.rating,
                            comment: review.comment || '',
                            created_at: review.created_at,
                            job_title: getReviewJobTitle(review.contract) || txRef.current('pages.freelancerProfile.jobFallback', undefined, 'Project'),
                            skills_rating: review.skills_rating || undefined,
                        };
                    }),
                };

                setFreelancer(formattedData);
                setCache(usernameOrId, formattedData);
            } catch (error) {
                logger.error('Error loading freelancer profile data', error);
                setFreelancer(null);
                setResolvedProfileId(null);
            } finally {
                if (showLoader) {
                    setIsLoading(false);
                }
            }
        }, [usernameOrId]);

    useEffect(() => {
        // If we have cached data, fetch in background without showing loader
        const hasCached = !!freelancer;
        void loadFreelancer(!hasCached);
    }, [loadFreelancer]);

    useEffect(() => {
        if (!resolvedProfileId) {
            return;
        }

        const channel = supabase
            .channel(`freelancer-profile-live-${resolvedProfileId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'freelancer_profiles',
                filter: `id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'public_profiles',
                filter: `id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'portfolio_items',
                filter: `freelancer_id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reviews',
                filter: `reviewee_id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [loadFreelancer, resolvedProfileId]);

    const viewerRole = useMemo<ProfilePageProps['viewerRole']>(() => {
        if (!user) return 'guest';

        const viewingOwnProfile = !usernameOrId || usernameOrId === user.id || usernameOrId === user.user_metadata?.username;
        if (viewingOwnProfile) return 'owner';

        if (activeMode === 'client') return 'client';
        if (activeMode === 'freelancer') return 'freelancer';

        if (profile?.user_type === 'freelancer') return 'freelancer';
        return 'client';
    }, [activeMode, profile?.user_type, user, usernameOrId]);

    if (isLoading && !freelancer) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <Header />
                <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    {/* Left column */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Profile header skeleton */}
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-[#262626]" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-6 w-48 bg-[#262626] rounded-lg" />
                                    <div className="h-4 w-32 bg-[#262626] rounded-lg" />
                                    <div className="flex gap-2">
                                        <div className="h-6 w-20 bg-[#262626] rounded-full" />
                                        <div className="h-6 w-20 bg-[#262626] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Bio skeleton */}
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-3">
                            <div className="h-4 w-32 bg-[#262626] rounded" />
                            <div className="h-4 w-full bg-[#262626] rounded" />
                            <div className="h-4 w-3/4 bg-[#262626] rounded" />
                        </div>
                        {/* Skills skeleton */}
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-3">
                            <div className="h-4 w-32 bg-[#262626] rounded" />
                            <div className="flex flex-wrap gap-2">
                                {[1,2,3,4].map(i => <div key={i} className="h-8 w-24 bg-[#262626] rounded-full" />)}
                            </div>
                        </div>
                    </div>
                    {/* Right column */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-3">
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                        </div>
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 grid grid-cols-2 gap-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#262626] rounded-xl" />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <Header />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Header />
            <ProfileView
                viewerRole={viewerRole}
                freelancer={freelancer}
                onOpenContact={() => {
                    if (!freelancer?.id) return;
                    setShowContactModal(true);
                }}
                onSaveBio={saveBio}
                onSaveSkills={saveSkills}
                onSaveTools={saveTools}
            />

            {freelancer?.id ? (
                <ContactModal
                    isOpen={showContactModal}
                    onClose={() => setShowContactModal(false)}
                    freelancerId={freelancer.id}
                    freelancerName={freelancer.full_name}
                />
            ) : null}
        </div>
    );
}
