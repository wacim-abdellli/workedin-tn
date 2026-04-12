import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List as ListIcon, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
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

export default function PortfolioDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { t } = useTranslation();

    const cacheKey = user ? `portfolio_${user.id}` : null;
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

    useEffect(() => {
        if (user) {
            // If cache hit, fetch in background without showing loader
            if (cached) setIsLoading(false);
            loadPortfolio();
        }
    }, [user?.id]);

    const loadPortfolio = async () => {
        try {
            const { data, error } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('freelancer_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const result = data || [];
            setItems(result);
            writeCache(result);
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

        try {
            if (editingItem) {
                // Update
                const { error } = await supabase
                    .from('portfolio_items')
                    .update({
                        ...data,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
                showToast(t.portfolio.workUpdated, 'success');
            } else {
                // Create
                const { error } = await supabase
                    .from('portfolio_items')
                    .insert({
                        ...data,
                        freelancer_id: user.id,
                        created_at: new Date().toISOString()
                    });

                if (error) throw error;
                showToast(t.portfolio.workAdded, 'success');
            }

            setIsModalOpen(false);
            setEditingItem(null);
            loadPortfolio();
        } catch (error) {
            logger.error('Error saving item:', error);
            showToast(t.portfolio.workSaved, 'error');
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
        <div className="min-h-screen bg-surface pb-20">
            <Header />

            <div className="container-custom py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground dark:text-white">{t.portfolio.title}</h1>
                        <p className="text-muted-foreground mt-1">{t.portfolio.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-white rounded-lg p-1 border border-border bg-card border-border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-muted text-primary-600' : 'text-muted hover:text-muted-foreground'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-muted text-primary-600' : 'text-muted hover:text-muted-foreground'}`}
                            >
                                <ListIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <Button
                            variant="primary"
                            leftIcon={<Plus className="w-5 h-5" />}
                            onClick={openAddModal}
                        >
                            {t.portfolio.addNew}
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-card dark:bg-[var(--color-bg-muted)] rounded-xl overflow-hidden border border-border dark:border-white/5 shadow-sm">
                                <Skeleton className="aspect-video w-full" />
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="flex gap-2 pt-1">
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`bg-card rounded-xl overflow-hidden border border-border shadow-sm group hover:shadow-md transition-shadow ${viewMode === 'list' ? 'flex' : ''} bg-card`}
                            >
                                <div className={`relative ${viewMode === 'list' ? 'w-48 h-32 flex-shrink-0' : 'aspect-video'}`}>
                                    {item.thumbnail_url || (item.media_urls && item.media_urls[0]) ? (
                                        <OptimizedImage
                                            src={item.thumbnail_url || item.media_urls?.[0] || ''}
                                            alt={item.title}
                                            className="w-full h-full"
                                            imgClassName="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted">
                                            <ImageIcon className="w-10 h-10" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            className="p-2 bg-card rounded-full text-muted-foreground hover:text-primary-600 transition-colors"
                                            onClick={() => openEditModal(item)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 bg-card rounded-full text-muted-foreground hover:text-red-500 transition-colors"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1 dark:text-white">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {item.skills_used?.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-surface text-muted-foreground text-xs rounded-md border border-border">
                                                {skill}
                                            </span>
                                        ))}
                                        {item.skills_used && item.skills_used.length > 3 && (
                                            <span className="px-2 py-1 bg-surface text-muted-foreground text-xs rounded-md border border-border">
                                                +{item.skills_used.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border bg-card border-border">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-muted" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2 dark:text-white">{t.portfolio.empty.title}</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t.portfolio.empty.description}</p>
                        <Button
                            variant="primary"
                            leftIcon={<Plus className="w-5 h-5" />}
                            onClick={openAddModal}
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
