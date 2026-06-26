import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { supabase } from '@/lib/supabase';
import {
    Eye, Lock, CheckCircle, Github, Globe, ExternalLink, FileSpreadsheet, Video, Link as LinkIcon,
} from 'lucide-react';
import { fmtSize, getLoomEmbedUrl } from './contractUtils';
import { FileIcon } from './sidebarPrimitives';
import type { ContractSharedFile, ContractDeliveryAsset, DeliveryLink } from './types';

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
