import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    LayoutGrid,
    List as ListIcon,
    Trash2,
    Edit2,
    Image as ImageIcon,
    CalendarDays,
    ExternalLink,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { PortfolioItem } from '../types';
import { useToast } from '../components/ui/Toast';
import PortfolioModal from '../components/freelancer/PortfolioModal';
import type { PortfolioSubmitData } from '../components/freelancer/PortfolioModal';
import OptimizedImage from '../components/common/OptimizedImage';
import { Skeleton } from '../components/common/SkeletonCard';
import { useTranslation } from '../i18n';
import { getPortfolioImageUrl, normalizePortfolioMediaFields } from '../lib/portfolioMedia';
import {
    composePortfolioSkillsFallback,
    normalizePortfolioTextArray,
    splitPortfolioSkillsAndTools,
} from '../lib/portfolioTools';

function formatPortfolioDate(value?: string): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
    });
}

function getProjectHost(value: string): string {
    try {
        return new URL(value).hostname.replace(/^www\./, '');
    } catch {
        return value;
    }
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const message = String((error as { message?: string }).message || '').toLowerCase();
    return message.includes(columnName.toLowerCase())
        && (message.includes('schema cache') || message.includes('column') || message.includes('does not exist'));
}

export default function PortfolioDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { t, tx } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const cacheKey = user ? `portfolio_${user.id}` : null;
    const mediaBackfillKey = user ? `portfolio_media_backfill_${user.id}` : null;
    const readCache = (): PortfolioItem[] | null => {
        if (!cacheKey) return null;
        try { const r = sessionStorage.getItem(cacheKey); return r ? JSON.parse(r) : null; } catch { return null; }
    };
    const writeCache = (items: PortfolioItem[]) => {
        if (!cacheKey) return;
        try { sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch { /* ignore */ }
    };

    const cached = readCache();
    const [items, setItems] = useState<PortfolioItem[]>(cached ?? []);
    const [isLoading, setIsLoading] = useState(!cached);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const requestedEditId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('edit');
    }, [location.search]);

    useEffect(() => {
        if (user) {
            // If cache hit, fetch in background without showing loader
            if (cached) setIsLoading(false);
            loadPortfolio();
        }
    }, [user?.id]);

    useEffect(() => {
        if (!requestedEditId || isModalOpen || items.length === 0) {
            return;
        }

        const targetItem = items.find((item) => item.id === requestedEditId);
        if (!targetItem) {
            return;
        }

        setEditingItem(targetItem);
        setIsModalOpen(true);

        const params = new URLSearchParams(location.search);
        params.delete('edit');

        const nextSearch = params.toString();
        navigate(
            {
                pathname: location.pathname,
                search: nextSearch ? `?${nextSearch}` : '',
            },
            { replace: true },
        );
    }, [isModalOpen, items, location.pathname, location.search, navigate, requestedEditId]);

    const loadPortfolio = async () => {
        try {
            const { data, error } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('freelancer_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const result = (data || []) as PortfolioItem[];
            const normalizedRows = result.map((item) => {
                const {
                    normalizedThumbnailUrl,
                    normalizedMediaUrls,
                    changed,
                } = normalizePortfolioMediaFields(item.thumbnail_url, item.media_urls);

                const {
                    skills: normalizedSkills,
                    tools: normalizedTools,
                } = splitPortfolioSkillsAndTools(item.skills_used, item.tools_used);

                return {
                    changed,
                    item: {
                        ...item,
                        thumbnail_url: normalizedThumbnailUrl || undefined,
                        media_urls: normalizedMediaUrls,
                        skills_used: normalizedSkills,
                        tools_used: normalizedTools,
                    },
                };
            });

            const normalizedItems = normalizedRows.map((entry) => entry.item);
            setItems(normalizedItems);
            writeCache(normalizedItems);

            if (mediaBackfillKey && sessionStorage.getItem(mediaBackfillKey) !== '1') {
                const rowsToBackfill = normalizedRows.filter((entry) => entry.changed);

                if (rowsToBackfill.length > 0) {
                    const updateResults = await Promise.all(
                        rowsToBackfill.map(({ item }) =>
                            supabase
                                .from('portfolio_items')
                                .update({
                                    media_urls: item.media_urls,
                                    thumbnail_url: item.thumbnail_url || null,
                                })
                                .eq('id', item.id)
                                .eq('freelancer_id', user!.id),
                        ),
                    );

                    const failedBackfill = updateResults.find((resultRow) => resultRow.error);
                    if (failedBackfill?.error) {
                        logger.warn('Portfolio media backfill failed for some rows:', failedBackfill.error);
                    } else {
                        sessionStorage.setItem(mediaBackfillKey, '1');
                    }
                } else {
                    sessionStorage.setItem(mediaBackfillKey, '1');
                }
            }
        } catch (error) {
            logger.error('Error loading portfolio:', error);
            showToast(t.portfolio.loadError, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (data: PortfolioSubmitData) => {
        if (!user) return;
        setIsSubmitting(true);

        const {
            normalizedThumbnailUrl,
            normalizedMediaUrls,
        } = normalizePortfolioMediaFields(data.media_urls?.[0], data.media_urls);

        const normalizedSkills = normalizePortfolioTextArray(data.skills_used);
        const normalizedTools = normalizePortfolioTextArray(data.tools_used);

        const payload = {
            title: data.title.trim(),
            description: data.description?.trim() || null,
            client_name: data.client_name?.trim() || null,
            project_url: data.project_url?.trim() || null,
            completion_date: data.completion_date || null,
            skills_used: normalizedSkills,
            tools_used: normalizedTools,
            media_urls: normalizedMediaUrls,
            thumbnail_url: normalizedThumbnailUrl || null,
        };

        const buildFallbackPayload = (error: unknown): Record<string, unknown> | null => {
            const missingClientName = isMissingColumnError(error, 'client_name');
            const missingToolsUsed = isMissingColumnError(error, 'tools_used');

            if (!missingClientName && !missingToolsUsed) {
                return null;
            }

            const fallbackPayload: Record<string, unknown> = { ...payload };

            if (missingToolsUsed) {
                fallbackPayload.skills_used = composePortfolioSkillsFallback(payload.skills_used, payload.tools_used);
                delete fallbackPayload.tools_used;
            }

            if (missingClientName) {
                delete fallbackPayload.client_name;
            }

            return fallbackPayload;
        };

        try {
            if (editingItem) {
                let { error } = await supabase
                    .from('portfolio_items')
                    .update(payload)
                    .eq('id', editingItem.id);

                if (error) {
                    const fallbackPayload = buildFallbackPayload(error);

                    if (fallbackPayload) {
                        const retry = await supabase
                            .from('portfolio_items')
                            .update(fallbackPayload)
                            .eq('id', editingItem.id);

                        error = retry.error;
                    }
                }

                if (error) throw error;
                showToast(t.portfolio.workUpdated, 'success');
            } else {
                const createdAt = new Date().toISOString();

                let { error } = await supabase
                    .from('portfolio_items')
                    .insert({
                        ...payload,
                        freelancer_id: user.id,
                        created_at: createdAt,
                    });

                if (error) {
                    const fallbackPayload = buildFallbackPayload(error);

                    if (fallbackPayload) {
                        const retry = await supabase
                            .from('portfolio_items')
                            .insert({
                                ...fallbackPayload,
                                freelancer_id: user.id,
                                created_at: createdAt,
                            });

                        error = retry.error;
                    }
                }

                if (error) throw error;
                showToast(t.portfolio.workAdded, 'success');
            }

            setIsModalOpen(false);
            setEditingItem(null);
            loadPortfolio();
        } catch (error) {
            logger.error('Error saving item:', error);
            showToast(t.portfolio.saveError, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.portfolio.deleteConfirm)) return;

        try {
            const { error } = await supabase
                .from('portfolio_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setItems(prev => prev.filter(item => item.id !== id));
            showToast(t.portfolio.workDeleted, 'success');
        } catch (error) {
            logger.error('Error deleting item:', error);
            showToast(t.portfolio.deleteError, 'error');
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item: PortfolioItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
            <Header />

            <div className="container-custom py-8">
                <div className="mb-8 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_85%_18%,rgba(139,92,246,0.18),transparent_42%),#141414] px-5 py-6 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-white">{t.portfolio.title}</h1>
                            <p className="text-white/60 mt-2 text-base">{t.portfolio.subtitle}</p>
                        </div>

                        <div className="flex items-center gap-3 self-start md:self-center">
                            <div className="flex items-center bg-[#1b1b1b] rounded-2xl p-1 border border-white/10">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`h-10 w-10 rounded-xl inline-flex items-center justify-center transition-colors ${
                                        viewMode === 'grid'
                                            ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/45'
                                            : 'text-white/45 hover:text-white/75'
                                    }`}
                                    aria-label={tx('portfolio.view.gridAria')}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`h-10 w-10 rounded-xl inline-flex items-center justify-center transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/45'
                                            : 'text-white/45 hover:text-white/75'
                                    }`}
                                    aria-label={tx('portfolio.view.listAria')}
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <Button
                                variant="primary"
                                leftIcon={<Plus className="w-5 h-5" />}
                                onClick={openAddModal}
                                className="!rounded-2xl !px-5 !py-2.5"
                            >
                                {t.portfolio.addNew}
                            </Button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-[#141414] rounded-2xl overflow-hidden border border-white/10 shadow-sm">
                                <Skeleton className="aspect-video w-full bg-white/5" />
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-5 w-3/4 bg-white/5" />
                                    <Skeleton className="h-4 w-full bg-white/5" />
                                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                                    <div className="flex gap-2 pt-1">
                                        <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
                                        <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                        {items.map((item) => {
                            const imageUrl = getPortfolioImageUrl(item.thumbnail_url, item.media_urls);

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-[#141414] rounded-2xl overflow-hidden border border-white/10 group transition-all duration-200 hover:border-white/20 hover:bg-[#181818] ${
                                        viewMode === 'list' ? 'sm:flex' : ''
                                    }`}
                                >
                                    <div className={`relative ${viewMode === 'list' ? 'w-full sm:w-56 h-44 sm:h-auto flex-shrink-0' : 'aspect-video'}`}>
                                        {imageUrl ? (
                                            <OptimizedImage
                                                src={imageUrl}
                                                alt={item.title}
                                                className="w-full h-full"
                                                imgClassName="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[radial-gradient(circle_at_28%_20%,rgba(139,92,246,0.18),transparent_46%),#101010] flex items-center justify-center text-white/30">
                                                <ImageIcon className="w-10 h-10" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                className="p-2.5 bg-black/60 rounded-full text-white/80 hover:text-white transition-colors border border-white/15"
                                                onClick={() => openEditModal(item)}
                                                aria-label={tx('portfolio.card.editItem', undefined, 'Edit portfolio item')}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-2.5 bg-black/60 rounded-full text-white/80 hover:text-red-400 transition-colors border border-white/15"
                                                onClick={() => handleDelete(item.id)}
                                                aria-label={tx('portfolio.card.deleteItem', undefined, 'Delete portfolio item')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-white mb-1.5 text-base line-clamp-1">{item.title}</h3>
                                            <p className="text-sm text-white/55 line-clamp-2">{item.description}</p>
                                            {item.client_name ? (
                                                <p className="mt-2 text-xs text-white/45">
                                                    {tx('portfolio.card.clientPrefix', undefined, 'Client')}: <span className="text-white/70">{item.client_name}</span>
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/45">
                                                {item.completion_date ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        {formatPortfolioDate(item.completion_date)}
                                                    </span>
                                                ) : null}
                                                {item.project_url ? (
                                                    <a
                                                        href={item.project_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="inline-flex items-center gap-1.5 text-[#8B5CF6] hover:text-[#a78bfa] transition-colors"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        {getProjectHost(item.project_url)}
                                                    </a>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {item.skills_used?.slice(0, 3).map((skill, i) => (
                                                    <span
                                                        key={i}
                                                        className="max-w-full truncate px-2.5 py-1 bg-[#8B5CF6]/12 text-[#c4b5fd] text-xs rounded-full border border-[#8B5CF6]/35"
                                                        title={skill}
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {item.skills_used && item.skills_used.length > 3 && (
                                                    <span className="px-2.5 py-1 bg-white/5 text-white/55 text-xs rounded-full border border-white/10">
                                                        +{item.skills_used.length - 3}
                                                    </span>
                                                )}
                                            </div>

                                            {item.tools_used && item.tools_used.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {item.tools_used.slice(0, 2).map((tool, index) => (
                                                        <span
                                                            key={`${tool}-${index}`}
                                                            className="max-w-full truncate px-2.5 py-1 bg-[#f59e0b]/12 text-[#fbbf24] text-xs rounded-full border border-[#f59e0b]/35"
                                                            title={tool}
                                                        >
                                                            {tool}
                                                        </span>
                                                    ))}
                                                    {item.tools_used.length > 2 ? (
                                                        <span className="px-2.5 py-1 bg-white/5 text-white/55 text-xs rounded-full border border-white/10">
                                                            +{item.tools_used.length - 2}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[#141414] rounded-3xl border border-dashed border-white/20">
                        <div className="w-16 h-16 bg-white/[0.04] rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-white/30" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{t.portfolio.empty.title}</h3>
                        <p className="text-white/55 mb-6 max-w-md mx-auto">{t.portfolio.empty.description}</p>
                        <Button
                            variant="primary"
                            leftIcon={<Plus className="w-5 h-5" />}
                            onClick={openAddModal}
                            className="!rounded-2xl !px-6"
                        >
                            {t.portfolio.addFirst}
                        </Button>
                    </div>
                )}
            </div>

            <PortfolioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={editingItem}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
