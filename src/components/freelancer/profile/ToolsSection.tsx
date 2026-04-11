import { useState, useMemo } from 'react';
import { Wrench, X, Check, Search, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { Tool, ToolCategory } from '@/types';
import { PREDEFINED_TOOLS } from '@/types';
import { useTranslation } from '../../../i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    tools: string[];  // Array of tool names
    language: string;
    isOwner?: boolean;
    onUpdate?: (tools: string[]) => void;
}

export default function ToolsSection({ tools, language, isOwner, onUpdate }: Props) {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    
    // Convert tool names to Tool objects
    const toolsAsObjects = useMemo(() => {
        return tools.map(toolName => 
            PREDEFINED_TOOLS.find(t => t.name_en === toolName) || 
            { id: toolName, name_en: toolName, name_ar: toolName, name_fr: toolName, category: 'other' as ToolCategory }
        );
    }, [tools]);
    
    const [selectedTools, setSelectedTools] = useState<Tool[]>(toolsAsObjects);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(new Set(['design', 'development']));
    const [saving, setSaving] = useState(false);

    // Group tools by category
    const toolsByCategory = useMemo(() => {
        const grouped: Record<ToolCategory, typeof PREDEFINED_TOOLS> = {
            design: [],
            development: [],
            productivity: [],
            video: [],
            marketing: [],
            other: [],
        };

        PREDEFINED_TOOLS.forEach(tool => {
            if (tool.category) {
                grouped[tool.category].push(tool);
            }
        });

        return grouped;
    }, []);

    // Filter tools based on search
    const filteredToolsByCategory = useMemo(() => {
        if (!searchQuery.trim()) return toolsByCategory;

        const query = searchQuery.toLowerCase();
        const filtered: Record<ToolCategory, typeof PREDEFINED_TOOLS> = {
            design: [],
            development: [],
            productivity: [],
            video: [],
            marketing: [],
            other: [],
        };

        Object.entries(toolsByCategory).forEach(([category, tools]) => {
            filtered[category as ToolCategory] = tools.filter(tool =>
                tool.name_en.toLowerCase().includes(query) ||
                tool.name_ar.includes(query) ||
                tool.name_fr.toLowerCase().includes(query)
            );
        });

        return filtered;
    }, [toolsByCategory, searchQuery]);

    const toggleCategory = (category: ToolCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const getCategoryLabel = (category: ToolCategory): string => {
        return tx(`profile.toolCategories.${category}`, undefined, category);
    };

    const getToolName = (tool: Tool): string => {
        switch (language) {
            case 'fr':
                return tool.name_fr;
            case 'en':
                return tool.name_en;
            default:
                return tool.name_ar;
        }
    };

    const toggleTool = (tool: Tool) => {
        if (selectedTools.find((t) => t.id === tool.id)) {
            setSelectedTools(selectedTools.filter((t) => t.id !== tool.id));
        } else if (selectedTools.length < 15) {  // Max 15 tools
            setSelectedTools([...selectedTools, tool]);
        }
    };

    const save = async () => {
        if (!user?.id) return;
        setSaving(true);
        
        const toolNames = selectedTools.map(tool => tool.name_en);
        
        await supabase.from('freelancer_profiles').update({ tools: toolNames }).eq('id', user.id);
        setSaving(false);
        setEditing(false);
        onUpdate?.(toolNames);
    };

    const cancel = () => {
        setSelectedTools(toolsAsObjects);
        setSearchQuery('');
        setEditing(false);
    };

    const displayTools = editing ? selectedTools : toolsAsObjects;

    return (
        <section className="rounded-xl border p-5 sm:p-6"
            style={{
                background: 'var(--color-background-elevated)',
                borderColor: editing ? 'var(--workspace-primary)' : 'var(--color-border-subtle)',
                outline: editing ? '2px solid color-mix(in srgb, var(--workspace-primary) 20%, transparent)' : 'none',
                outlineOffset: '2px',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                        style={{ color: 'var(--workspace-primary)' }}>
                        {tx('profile.toolsOptional', undefined, 'Tools (Optional)')}
                    </p>
                    <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Wrench className="w-4 h-4" />
                        {tx('profile.tools', undefined, 'Tools')}
                    </h2>
                </div>

                {isOwner && !editing && (
                    <button onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                        style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--workspace-primary)'; e.currentTarget.style.color = 'var(--workspace-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}>
                        <Wrench className="h-3 w-3" /> {tx('ui.edit')}</button>
                )}
                {isOwner && editing && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                                background: selectedTools.length === 15 ? 'var(--workspace-primary)' : 'var(--color-background-subtle)',
                                color: selectedTools.length === 15 ? 'white' : 'var(--color-text-secondary)',
                            }}>
                            {selectedTools.length}/15
                        </span>
                        <button onClick={cancel}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
                            <X className="h-3 w-3" /> {tx('ui.cancel')}</button>
                        <button onClick={save} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                            style={{ background: 'var(--workspace-primary)' }}>
                            <Check className="h-3 w-3" />
                            {tx('ui.save')}</button>
                    </div>
                )}
            </div>

            {editing ? (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder={tx('profile.searchTools', undefined, 'Search tools...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none"
                            style={{
                                borderColor: 'var(--color-border-default)',
                                background: 'var(--color-background-subtle)',
                                color: 'var(--color-text-primary)',
                            }}
                        />
                    </div>

                    {/* Tools by Category */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {(Object.entries(filteredToolsByCategory) as [ToolCategory, typeof PREDEFINED_TOOLS][]).map(([category, categoryTools]) => {
                            if (categoryTools.length === 0) return null;
                            
                            const isExpanded = expandedCategories.has(category);
                            const primaryTools = categoryTools.filter(t => t.isPrimary);
                            const secondaryTools = categoryTools.filter(t => !t.isPrimary);
                            const displayCategoryTools = isExpanded ? categoryTools : primaryTools;

                            return (
                                <div key={category} className="border rounded-lg overflow-hidden"
                                    style={{ borderColor: 'var(--color-border-default)' }}>
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                                        style={{
                                            background: 'var(--color-background-subtle)',
                                            color: 'var(--color-text-primary)',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-elevated)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-background-subtle)'}
                                    >
                                        <span className="text-xs font-semibold" style={{ color: 'var(--workspace-primary)' }}>
                                            {getCategoryLabel(category)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                                {categoryTools.filter(t => selectedTools.find(sel => sel.id === t.id)).length}/{categoryTools.length}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
                                            )}
                                        </div>
                                    </button>
                                    
                                    {displayCategoryTools.length > 0 && (
                                        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                            {displayCategoryTools.map((tool) => {
                                                const isSelected = selectedTools.find((t) => t.id === tool.id);
                                                return (
                                                    <button
                                                        key={tool.id}
                                                        type="button"
                                                        onClick={() => toggleTool(tool)}
                                                        className="p-2 rounded-lg text-left transition-all text-xs font-medium flex items-center justify-between"
                                                        style={{
                                                            background: isSelected ? 'var(--workspace-primary)' : 'var(--color-background-elevated)',
                                                            color: isSelected ? 'white' : 'var(--color-text-primary)',
                                                            borderWidth: '1px',
                                                            borderStyle: 'solid',
                                                            borderColor: isSelected ? 'var(--workspace-primary)' : 'var(--color-border-default)',
                                                        }}
                                                    >
                                                        <span>{getToolName(tool)}</span>
                                                        {isSelected && <CheckCircle className="w-3 h-3 ml-1" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    {!isExpanded && secondaryTools.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category)}
                                            className="w-full px-3 py-1.5 text-xs transition-colors"
                                            style={{
                                                color: 'var(--workspace-primary)',
                                                background: 'var(--color-background-subtle)',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-elevated)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-background-subtle)'}
                                        >
                                            + {secondaryTools.length} {tx('profile.secondarySkills', undefined, 'more')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <>
                    {displayTools.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {displayTools.map((tool) => (
                                <span key={tool.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border"
                                    style={{
                                        borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, var(--color-border-subtle))',
                                        background: 'color-mix(in srgb, var(--workspace-primary) 8%, var(--color-background-subtle))',
                                        color: 'var(--workspace-primary)',
                                    }}>
                                    {getToolName(tool)}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center rounded-lg border border-dashed"
                            style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-background-subtle)' }}>
                            <p className="text-sm italic" style={{ color: 'var(--color-text-tertiary)' }}>
                                {isOwner ? 'Click Edit to add your tools' : 'No tools added yet'}
                            </p>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
