import { useState } from 'react';
import { useTranslation } from '@/i18n';
import {
    Eye, Lock, CheckCircle, FolderOpen, LayoutGrid, List, ChevronRight,
} from 'lucide-react';
import { fmtSize, fmtDate, fmtTime, focusRing, labelClass, monoClass } from './contractUtils';
import { FileIcon } from './sidebarPrimitives';
import type { ContractSharedFile, ContractDeliveryAsset, FileFilter, WorkspaceModel } from './types';
export { ImagePreview, DeliveryFileHeroCard, DeliveryLinkHeroCard } from './HeroCards';

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
