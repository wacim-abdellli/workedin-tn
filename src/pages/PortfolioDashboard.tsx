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
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            loadPortfolio();
        }
    }, [user]);

    const loadPortfolio = async () => {
        try {
            const { data, error } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('freelancer_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
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
        <div className="min-h-screen bg-gray-50 pb-20 dark:bg-gray-900">
            <Header />

            <div className="container-custom py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.portfolio.title}</h1>
                        <p className="text-gray-500 mt-1 dark:text-gray-400">{t.portfolio.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-white rounded-lg p-1 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
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
                            <div key={i} className="bg-white dark:bg-[#1a1825] rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
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
                                className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 shadow-sm group hover:shadow-md transition-shadow ${viewMode === 'list' ? 'flex' : ''} dark:bg-gray-800`}
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
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 dark:bg-gray-800">
                                            <ImageIcon className="w-10 h-10" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-600 transition-colors dark:bg-gray-800 dark:text-gray-200"
                                            onClick={() => openEditModal(item)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 bg-white rounded-full text-gray-700 hover:text-red-500 transition-colors dark:bg-gray-800 dark:text-gray-200"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1 dark:text-white">{item.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{item.description}</p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {item.skills_used?.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100 dark:bg-gray-900 dark:text-gray-300">
                                                {skill}
                                            </span>
                                        ))}
                                        {item.skills_used && item.skills_used.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100 dark:bg-gray-900 dark:text-gray-300">
                                                +{item.skills_used.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-900">
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">{t.portfolio.empty.title}</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto dark:text-gray-400">{t.portfolio.empty.description}</p>
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
