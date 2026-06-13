import { useState } from 'react';
import { Upload, X, FileCheck2, ScanLine, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

export interface FileMeta {
    name: string;
    sizeKB: number;
}

interface DocumentUploadProps {
    stepIndex: number;
    totalSteps: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    tip: string;
    preview: string;
    fileMeta: FileMeta | null;
    errorMessage: string;
    onFileSelect: (file: File) => void;
    onClear: () => void;
    onNext: () => void;
    onBack?: () => void;
    canProceed: boolean;
    inputId: string;
    isUploading?: boolean;
    captureMode?: 'user' | 'environment';
}

export default function DocumentUpload({
    stepIndex, totalSteps, title, description, icon, tip,
    preview, fileMeta, errorMessage,
    onFileSelect, onClear, onNext, onBack,
    canProceed, inputId, isUploading, captureMode,
}: DocumentUploadProps) {
    const { t, tx } = useTranslation();
    const [dragging, setDragging] = useState(false);

    const onDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelect(file);
    };

    return (
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/45 p-6 shadow-2xl backdrop-blur-xl md:p-8 relative overflow-hidden">
            <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <ScanLine className="h-3.5 w-3.5" />
                    {tx('verifyIdentity.stepCounter', { current: stepIndex + 1, total: totalSteps }, `Step ${stepIndex + 1} of ${totalSteps}`)}
                </span>
                <span className="text-xs font-bold text-zinc-400 bg-zinc-900/80 border border-zinc-800/60 px-2.5 py-1 rounded-md">{Math.round(((stepIndex + 1) / totalSteps) * 100)}%</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
                    <p className="text-sm text-zinc-400">{description}</p>
                </div>
            </div>

            <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 text-xs text-cyan-300 flex items-start gap-2 leading-relaxed">
                <ScanLine className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold uppercase tracking-wider text-cyan-400 mr-1">{tx('verifyIdentity.tipLabel', undefined, 'Tip:')}</span> {tip}
                </div>
            </div>

            <div className="mb-8">
                {preview ? (
                    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 group shadow-lg">
                        <img src={preview} alt={tx('verifyIdentity.preview', undefined, 'Preview')} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => document.getElementById(inputId)?.click()}
                                    className="rounded-xl bg-white px-5 py-2.5 font-bold text-zinc-950 transition-all duration-300 hover:bg-zinc-200 hover:scale-[1.02] shadow-lg"
                                >
                                    {tx('verifyIdentity.changeImage', undefined, 'Change')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClear}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 font-bold text-red-400 transition-all duration-300 hover:bg-red-500/20 hover:scale-[1.02]"
                                >
                                    <X className="h-4 w-4" />
                                    {tx('verifyIdentity.removeImage', undefined, 'Remove')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => document.getElementById(inputId)?.click()}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        aria-label={tx('verifyIdentity.uploadHint', undefined, 'Click to upload image')}
                        className={`h-64 w-full cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 group flex flex-col items-center justify-center ${
                            dragging
                                ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_25px_rgba(168,85,247,0.15)]'
                                : 'border-zinc-800 bg-zinc-900/10 hover:border-purple-500/40 hover:bg-purple-500/5 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                        }`}
                    >
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/30 group-hover:bg-purple-500/10 mb-4 transition-all duration-300 shadow-inner">
                            <Upload className="w-7 h-7" />
                        </div>
                        <p className="text-zinc-300 font-bold text-base transition-colors group-hover:text-white">{tx('verifyIdentity.uploadHint', undefined, 'Click to upload image')}</p>
                        <p className="text-xs text-zinc-500 mt-1.5">{tx('verifyIdentity.dragDropHint', undefined, 'or drag and drop here')}</p>
                        <p className="text-xs text-zinc-500 mt-3 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1 rounded-full">{tx('verifyIdentity.fileFormatHint', undefined, 'JPG, PNG (Max 5MB)')}</p>
                    </button>
                )}

                {fileMeta && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2 text-xs text-emerald-400">
                        <FileCheck2 className="h-4 w-4 text-emerald-400" />
                        <span className="font-semibold">{fileMeta.name}</span>
                        <span className="text-emerald-500/70">({fileMeta.sizeKB} KB)</span>
                    </div>
                )}
                {errorMessage && <p className="mt-3 text-xs font-semibold text-red-400 bg-red-500/5 border border-red-500/20 px-3.5 py-2 rounded-xl">{errorMessage}</p>}

                <input
                    id={inputId}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.bmp"
                    capture={captureMode}
                    onChange={e => { const file = e.target.files?.[0]; if (file) onFileSelect(file); }}
                    className="hidden"
                />
            </div>

            <div className="flex items-center justify-between mt-8 border-t border-zinc-800/80 pt-6">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1.5 font-bold text-zinc-400 hover:text-white transition-colors py-2"
                    >
                        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                        {t.common.back}
                    </button>
                ) : <div />}

                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canProceed || isUploading}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:shadow-none shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />{tx('verifyIdentity.processing', undefined, 'Processing...')}</>
                    ) : (
                        <>{t.common.next}<ChevronLeft className="w-5 h-5 rtl:rotate-180" /></>
                    )}
                </button>
            </div>
        </div>
    );
}
