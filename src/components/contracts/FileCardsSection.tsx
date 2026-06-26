import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from '@/i18n';
import { supabase } from '@/lib/supabase';
import {
    Eye, Lock, CheckCircle, FolderOpen, LayoutGrid, List, ChevronRight,
    Github, Video, Globe, ExternalLink, FileSpreadsheet, Link as LinkIcon,
} from 'lucide-react';
import { ns, fmtDate, fmtTime, fmtSize, getLoomEmbedUrl, focusRing, labelClass, monoClass } from './contractUtils';
import { FileIcon } from './sidebarPrimitives';
import type { ContractSharedFile, ContractDeliveryAsset, DeliveryLink, FileFilter, WorkspaceModel } from './types';

export function DeliveryFileCard({ file, onPreviewFile }: { file: ContractDeliveryAsset; onPreviewFile: (file: ContractSharedFile) => void }) {
    const { tx } = useTranslation();
    const contractFile: ContractSharedFile = { id: file.id, name: file.name, url: '', type: file.mimeType ?? null, size: file.sizeBytes ?? null, storageBucket: file.storageBucket ?? 'contract-files', storagePath: file.storagePath };

    return (
        <div className="group relative border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 flex flex-col justify-between h-[150px] transition-all duration-200 hover:border-zinc-700">
            <div className="flex items-start justify-between gap-3">
                <FileIcon name={file.name} mimeType={file.mimeType} />
                <span className="rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-350">
                    {file.assetKind === 'final_asset' ? tx('pages.messages.contractDetails.finalSource') : tx('pages.messages.contractDetails.delivery')}
                </span>
            </div>

            <div className="mt-3 min-w-0">
                <h4 className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-white transition-colors" title={file.name}>
                    {file.name}
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    {fmtSize(file.sizeBytes) || tx('pages.messages.contractDetails.sizeUnknown')}
                </p>
            </div>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
                <button
                    type="button"
                    onClick={() => onPreviewFile(contractFile)}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white text-[#0A0A0B] px-3.5 py-1.5 text-[11px] font-bold shadow-md transition-all"
                >
                    <Eye className="h-3.5 w-3.5" />
                    {tx('pages.messages.contractDetails.openFile')}
                </button>
            </div>
        </div>
    );
}

export function SharedFileCard({ file, onPreviewFile }: { file: ContractSharedFile; onPreviewFile: (file: ContractSharedFile) => void }) {
    const { tx } = useTranslation();
    return (
        <div className="group relative border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 flex flex-col justify-between h-[150px] transition-all duration-200 hover:border-zinc-700">
            <div className="flex items-start justify-between gap-3">
                <FileIcon name={file.name} mimeType={file.type} />
                <span className="rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-350">{tx('pages.messages.contractDetails.shared')}</span>
            </div>

            <div className="mt-3 min-w-0">
                <h4 className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-white transition-colors" title={file.name}>
                    {file.name}
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    {[file.senderName || tx('pages.messages.contractDetails.clientFallback'), fmtSize(file.size)].filter(Boolean).join(' · ')}
                </p>
            </div>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
                <button
                    type="button"
                    onClick={() => onPreviewFile(file)}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white text-[#0A0A0B] px-3.5 py-1.5 text-[11px] font-bold shadow-md transition-all"
                >
                    <Eye className="h-3.5 w-3.5" />
                    {tx('pages.messages.contractDetails.openFile')}
                </button>
            </div>
        </div>
    );
}

function DeliveryFileCardRow({ file, onPreviewFile }: { file: ContractDeliveryAsset; onPreviewFile: (file: ContractSharedFile) => void }) {
    const { tx } = useTranslation();
    const contractFile: ContractSharedFile = { id: file.id, name: file.name, url: '', type: file.mimeType ?? null, size: file.sizeBytes ?? null, storageBucket: file.storageBucket ?? 'contract-files', storagePath: file.storagePath };

    return (
        <button type="button" onClick={() => onPreviewFile(contractFile)}
            className={`group flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-left transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/40 ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.mimeType} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-zinc-100 transition-colors group-hover:text-white">{file.name}</p>
                <p className={`${monoClass} mt-0.5`}>{file.assetKind === 'final_asset' ? tx('pages.messages.contractDetails.finalSourceFile') : tx('pages.messages.contractDetails.deliveryFile')} - {fmtSize(file.sizeBytes) || tx('pages.messages.contractDetails.sizeUnknown')}</p>
            </div>
            <span className="shrink-0 rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-350">
                {file.assetKind === 'final_asset' ? tx('pages.messages.contractDetails.finalSource') : tx('pages.messages.contractDetails.delivery')}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-200" />
        </button>
    );
}

function SharedFileCardRow({ file, onPreviewFile }: { file: ContractSharedFile; onPreviewFile: (file: ContractSharedFile) => void }) {
    const { tx } = useTranslation();
    return (
        <button type="button" onClick={() => onPreviewFile(file)}
            className={`group flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-left transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/40 disabled:cursor-default ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.type} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white group-hover:text-white transition-colors">{file.name}</p>
                <p className={`${monoClass} mt-0.5`}>{[file.senderName || tx('pages.messages.contractDetails.clientUpload'), fmtDate(file.uploadedAt, tx('pages.messages.contractDetails.unknownDate')), fmtSize(file.size)].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="shrink-0 rounded-full border border-zinc-750 bg-zinc-850 text-zinc-350 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">{tx('pages.messages.contractDetails.shared')}</span>
            <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
        </button>
    );
}

export function FilesEmptyState({ userRole, canDeliver, onDeliver }: { userRole: 'client' | 'freelancer'; canDeliver: boolean; onDeliver: () => void }) {
    const { tx } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/10 py-10 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 text-zinc-500 shadow-inner">
                <FolderOpen className="h-6 w-6 text-zinc-450" />
            </div>
            <div className="max-w-sm">
                <h4 className="text-[14px] font-bold text-white">{tx('pages.messages.contractDetails.noFilesShared')}</h4>
                <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
                    {userRole === 'freelancer'
                        ? tx('pages.messages.contractDetails.filesEmptyFreelancerDesc')
                        : tx('pages.messages.contractDetails.filesEmptyClientDesc')}
                </p>
            </div>
            {userRole === 'freelancer' && canDeliver && (
                <button type="button" onClick={onDeliver} className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-[12px] font-bold text-white transition-all duration-150 shadow-md">
                    {tx('pages.messages.contractDetails.submitDeliverable')}
                </button>
            )}
        </div>
    );
}

export function FilesTab({ model, fileFilter, setFileFilter, userRole, onPreviewFile, onDeliver, isSidebar = false }: { model: WorkspaceModel; fileFilter: FileFilter; setFileFilter: (filter: FileFilter) => void; userRole: 'client' | 'freelancer'; onPreviewFile: (file: ContractSharedFile) => void; onDeliver: () => void; isSidebar?: boolean }) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { tx } = useTranslation();

    const filters: Array<{ id: FileFilter; label: string }> = [
        { id: 'all', label: tx('pages.messages.contractDetails.allFiles') },
        { id: 'delivery', label: tx('pages.messages.contractDetails.deliveries') },
        { id: 'shared', label: tx('pages.messages.contractDetails.sharedFiles') },
    ];
    const showShared = fileFilter === 'all' || fileFilter === 'shared';
    const showDelivery = fileFilter === 'all' || fileFilter === 'delivery';

    const visibleDeliveries = showDelivery ? [...model.reviewFiles, ...model.finalFiles] : [];
    const visibleShared = showShared ? model.sharedFiles : [];
    const totalVisible = visibleDeliveries.length + visibleShared.length;

    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-805/50 pb-4">
                <div>
                    <p className={labelClass}>{tx('pages.messages.contractDetails.fileManager')}</p>
                    <h3 className="text-[16px] font-bold text-zinc-100 mt-0.5">{tx('pages.messages.contractDetails.workspaceAssets')}</h3>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-zinc-950/40 border border-zinc-800 p-1 rounded-full">
                        {filters.map((filter) => (
                            <button key={filter.id} type="button" onClick={() => setFileFilter(filter.id)}
                                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all leading-none ${
                                    fileFilter === filter.id
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}>
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex border border-zinc-800 bg-zinc-950/40 p-1 rounded-full">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`p-1 rounded-full transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                            aria-label={tx('pages.messages.contractDetails.gridView')}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`p-1 rounded-full transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                            aria-label={tx('pages.messages.contractDetails.listView')}
                        >
                            <List className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {totalVisible > 0 ? (
                viewMode === 'grid' ? (
                    <div className={isSidebar ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}>
                        {showDelivery && model.reviewFiles.map(file => (
                            <DeliveryFileCard key={file.id} file={file} onPreviewFile={onPreviewFile} />
                        ))}
                        {showDelivery && model.finalFiles.map(file => (
                            <DeliveryFileCard key={file.id} file={file} onPreviewFile={onPreviewFile} />
                        ))}
                        {showShared && model.sharedFiles.map(file => (
                            <SharedFileCard key={file.id} file={file} onPreviewFile={onPreviewFile} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {showDelivery && model.reviewFiles.map(file => (
                            <DeliveryFileCardRow key={file.id} file={file} onPreviewFile={onPreviewFile} />
                        ))}
                        {showDelivery && model.finalFiles.map(file => (
                            <DeliveryFileCardRow key={file.id} file={file} onPreviewFile={onPreviewFile} />
                        ))}
                        {showShared && model.sharedFiles.map(file => (
                            <SharedFileCardRow key={file.id} file={file} onPreviewFile={onPreviewFile} />
                        ))}
                    </div>
                )
            ) : (
                <FilesEmptyState userRole={userRole} canDeliver={model.showFreelancerDeliver} onDeliver={onDeliver} />
            )}
        </section>
    );
}

export function ImagePreview({ storageBucket, storagePath }: { storageBucket: string; storagePath: string }) {
    const { tx } = useTranslation();
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const { data, error } = await supabase.storage
                    .from(storageBucket)
                    .createSignedUrl(storagePath, 3600);
                if (error) throw error;
                if (active && data?.signedUrl) {
                    setUrl(data.signedUrl);
                }
            } catch (e) {
                console.warn('[ImagePreview] Failed to get signed URL:', e);
                if (active) setError(true);
            }
        };
        void load();
        return () => { active = false; };
    }, [storageBucket, storagePath]);

    if (error) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-[11px] text-zinc-500">{tx('pages.messages.contractDetails.previewUnavailable')}</div>;
    if (!url) return <div className="flex h-full w-full items-center justify-center bg-zinc-950/20"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-zinc-400" /></div>;

    return <img src={url} alt={tx('pages.messages.contractDetails.deliveryPreview')} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />;
}

export function EscrowVaultVisualizer({ isLocked }: { isLocked: boolean }) {
    const { tx } = useTranslation();
    return (
        <div className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 ${
            isLocked
                ? 'border-amber-500/20 bg-amber-500/5'
                : 'border-emerald-500/20 bg-emerald-500/5'
        }`}>
            {isLocked ? (
                <Lock className="h-4 w-4 shrink-0 text-amber-500" />
            ) : (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-550" />
            )}
            <div className="flex-1 min-w-0 text-[12px] leading-snug">
                <span className={`font-bold ${isLocked ? 'text-amber-400' : 'text-emerald-450'}`}>
                    {isLocked ? tx('pages.messages.contractDetails.escrowVaultSecured') : tx('pages.messages.contractDetails.escrowReleased')}
                </span>
                <span className="text-zinc-350">
                    {isLocked
                        ? tx('pages.messages.contractDetails.vaultLockedDesc')
                        : tx('pages.messages.contractDetails.vaultUnlockedDesc')}
                </span>
            </div>
        </div>
    );
}

export function DeliveryFileHeroCard({ file, onPreviewFile }: { file: ContractDeliveryAsset; onPreviewFile: (file: ContractSharedFile) => void }) {
    const { tx } = useTranslation();
    const contractFile: ContractSharedFile = { id: file.id, name: file.name, url: '', type: file.mimeType ?? null, size: file.sizeBytes ?? null, storageBucket: file.storageBucket ?? 'contract-files', storagePath: file.storagePath };

    const value = `${file.name || ''} ${file.mimeType || ''}`.toLowerCase();
    const isImage = value.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
    const isLocked = file.assetKind === 'final_asset' && file.accessState === 'locked';

    return (
        <div className="group relative border border-zinc-800 bg-zinc-900/30 rounded-xl flex flex-col overflow-hidden transition-all duration-200 hover:border-zinc-700">
            <div className="h-[140px] w-full bg-[#161719] border-b border-zinc-800 flex items-center justify-center overflow-hidden relative">
                {isImage && !isLocked ? (
                    <ImagePreview storageBucket={file.storageBucket || 'contract-files'} storagePath={file.storagePath} />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <FileIcon name={file.name} mimeType={file.mimeType} />
                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{file.mimeType?.split('/')[1] || tx('pages.messages.contractDetails.fileLabel')}</span>
                    </div>
                )}

                {isLocked ? (
                    <span className="absolute top-3 right-3 rounded-full border border-amber-500/20 bg-amber-500/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-sm flex items-center gap-0.5">
                        <Lock className="h-2 w-2" /> {tx('pages.messages.contractDetails.escrowLock')}
                    </span>
                ) : (
                    <span className="absolute top-3 right-3 rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-350 backdrop-blur-sm">
                        {file.assetKind === 'final_asset' ? tx('pages.messages.contractDetails.finalSource') : tx('pages.messages.contractDetails.delivery')}
                    </span>
                )}
            </div>

            <div className="p-4 flex flex-col justify-between flex-grow">
                <div className="min-w-0">
                    <h4 className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-white transition-colors" title={file.name}>
                        {file.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                        {fmtSize(file.sizeBytes) || tx('pages.messages.contractDetails.sizeUnknown')}
                    </p>
                </div>
            </div>

            {isLocked ? (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] rounded-xl flex flex-col items-center justify-center p-3 text-center opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <Lock className="h-5 w-5 text-amber-400" />
                    <p className="text-[11px] font-semibold text-zinc-300 mt-1">{tx('pages.messages.contractDetails.escrowLocked')}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5 leading-tight max-w-[200px]">{tx('pages.messages.contractDetails.approveReleaseToUnlock')}</p>
                </div>
            ) : (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <button
                        type="button"
                        onClick={() => onPreviewFile(contractFile)}
                        className="flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white text-[#0A0A0B] px-3.5 py-2 text-[11px] font-bold shadow-md transition-all transform translate-y-2 group-hover:translate-y-0 duration-200"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        {tx('pages.messages.contractDetails.openFile')}
                    </button>
                </div>
            )}
        </div>
    );
}

export function DeliveryLinkHeroCard({
    link,
    reveal,
    onInspectPreview
}: {
    link: DeliveryLink;
    reveal: boolean;
    onInspectPreview?: (url: string, label: string, category: string) => void;
}) {
    const { tx } = useTranslation();
    const [copied, setCopied] = useState(false);

    const isGithub = link.category === 'github';
    const isFigma = link.category === 'figma';
    const isLoom = link.category === 'loom';
    const isDrive = link.category === 'drive';
    const isVercel = link.category === 'vercel';

    const loomEmbed = isLoom ? getLoomEmbedUrl(link.url) : null;

    if (isLoom && loomEmbed && reveal) {
        return (
            <div className="group relative border border-white/[0.06] bg-[#070709] rounded-xl flex flex-col overflow-hidden transition-all duration-200 hover:border-violet-500/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="relative w-full pb-[56.25%] bg-black">
                    <iframe
                        src={loomEmbed}
                        frameBorder="0"
                        webkitallowfullscreen="true"
                        mozallowfullscreen="true"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                    />
                </div>
                <div className="p-3 border-t border-white/[0.04] bg-zinc-950/40">
                    <h4 className="truncate text-[12px] font-semibold text-zinc-200 leading-none">{link.label}</h4>
                    <p className="text-[10px] text-zinc-550 font-mono mt-1.5 truncate leading-none">{link.url}</p>
                </div>
            </div>
        );
    }

    let categoryLabel = tx('pages.messages.contractDetails.categoryLink');
    let CategoryIcon: React.ComponentType<{ className?: string }> = LinkIcon;

    if (isGithub) {
        categoryLabel = tx('pages.messages.contractDetails.categoryRepository');
        CategoryIcon = Github;
    } else if (isFigma) {
        categoryLabel = tx('pages.messages.contractDetails.categoryFigmaPrototype');
        CategoryIcon = Globe;
    } else if (isDrive) {
        categoryLabel = tx('pages.messages.contractDetails.categoryCloudDrive');
        CategoryIcon = FileSpreadsheet;
    } else if (isLoom) {
        categoryLabel = tx('pages.messages.contractDetails.categoryLoomVideo');
        CategoryIcon = Video;
    } else if (isVercel) {
        categoryLabel = tx('pages.messages.contractDetails.categoryStagingSite');
        CategoryIcon = ExternalLink;
    }

    const handleCopyCredentials = () => {
        if (!link.credentials) return;
        navigator.clipboard.writeText(link.credentials);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative border border-zinc-800 bg-zinc-900/30 rounded-xl flex flex-col overflow-hidden transition-all duration-200 hover:border-zinc-700">
            <div className="h-[140px] w-full bg-[#161719] border-b border-zinc-800 flex items-center justify-center relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-350">
                    <CategoryIcon className="h-5 w-5" />
                </div>

                <span className="absolute top-3 right-3 rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-350 backdrop-blur-sm">
                    {categoryLabel}
                </span>

                {link.link_kind === 'final_link' && (
                    <span className="absolute top-3 left-3 rounded-full border border-amber-500/20 bg-amber-500/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-sm flex items-center gap-0.5">
                        <Lock className="h-2 w-2" /> {tx('pages.messages.contractDetails.escrowLock')}
                    </span>
                )}
            </div>

            <div className="p-4 flex flex-col justify-between flex-grow">
                <div className="min-w-0">
                    <h4 className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-white transition-colors" title={link.label}>
                        {link.label}
                    </h4>
                    {reveal ? (
                        <p className="text-[11px] text-zinc-500 mt-1 truncate font-mono select-all">
                            {link.url}
                        </p>
                    ) : (
                        <p className="text-[11px] text-zinc-500 mt-1 truncate font-mono select-none blur-[2.5px]">
                            https://hidden-until-payment-release.com
                        </p>
                    )}

                    {link.credentials && (
                        <div className="mt-2 border-t border-zinc-850 pt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{tx('pages.messages.contractDetails.accessInfo')}</p>
                            {reveal ? (
                                <div className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-black/40 border border-zinc-800 p-1.5 font-mono text-[10px] text-zinc-300">
                                    <span className="truncate">{link.credentials}</span>
                                    <button
                                        type="button"
                                        onClick={handleCopyCredentials}
                                        className="shrink-0 text-emerald-500 hover:text-emerald-400 font-semibold"
                                    >
                                        {copied ? tx('pages.messages.contractDetails.copied') : tx('pages.messages.contractDetails.copy')}
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-1 text-[10px] italic text-amber-300/80 flex items-center gap-1">
                                    <Lock className="h-2.5 w-2.5 shrink-0" /> {tx('pages.messages.contractDetails.hiddenUntilPayment')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {reveal ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white text-[#0A0A0B] px-3.5 py-2 text-[11px] font-bold shadow-md transition-all transform translate-y-2 group-hover:translate-y-0 duration-200"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {tx('pages.messages.contractDetails.openLink')}
                    </a>
                    {onInspectPreview && (isVercel || isFigma || link.category === 'other') && (
                        <button
                            type="button"
                            onClick={() => onInspectPreview(link.url, link.label, link.category)}
                            className="flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-[11px] font-bold shadow-md transition-all transform translate-y-2 group-hover:translate-y-0 duration-200"
                        >
                            <Globe className="h-3.5 w-3.5" />
                            {tx('pages.messages.contractDetails.inspect')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] rounded-xl flex flex-col items-center justify-center p-3 text-center opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <Lock className="h-5 w-5 text-amber-400" />
                    <p className="text-[11px] font-semibold text-zinc-300 mt-1">{tx('pages.messages.contractDetails.escrowLocked')}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5 leading-tight max-w-[200px]">{tx('pages.messages.contractDetails.approveReleaseToUnlock')}</p>
                </div>
            )}
        </div>
    );
}
