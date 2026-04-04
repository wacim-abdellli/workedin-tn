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
        <div className="rounded-3xl border border-white/10 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-[#1d2231]/90 md:p-8">
            <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                    <ScanLine className="h-3.5 w-3.5" />
                    {tx('verifyIdentity.stepCounter', { current: stepIndex + 1, total: totalSteps }, `Step ${stepIndex + 1} of ${totalSteps}`)}
                </span>
                <span className="text-xs font-medium text-muted">{Math.round(((stepIndex + 1) / totalSteps) * 100)}%</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>

            <div className="mb-4 rounded-2xl border border-blue-200/60 bg-blue-50/80 p-3 text-xs text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                <span className="font-semibold">{tx('verifyIdentity.tipLabel', undefined, 'Tip:')}</span> {tip}
            </div>

            <div className="mb-8">
                {preview ? (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary-500/70 group">
                        <img src={preview} alt={tx('verifyIdentity.preview', undefined, 'Preview')} className="w-full h-64 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center gap-3">
                                <button onClick={() => document.getElementById(inputId)?.click()} className="rounded-lg bg-white px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-white">
                                    {tx('verifyIdentity.changeImage', undefined, 'Change')}
                                </button>
                                <button onClick={onClear} className="inline-flex items-center gap-1 rounded-lg border border-white/40 bg-white/15 px-4 py-2 font-medium text-white transition-colors hover:bg-white/25">
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
                        className={`h-64 w-full cursor-pointer rounded-2xl border-2 border-dashed transition-colors group flex flex-col items-center justify-center ${dragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/15' : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:hover:bg-primary-900/10'}`}
                    >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 group-hover:text-primary-500 mb-4 transition-colors">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">{tx('verifyIdentity.uploadHint', undefined, 'Click to upload image')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tx('verifyIdentity.dragDropHint', undefined, 'or drag and drop here')}</p>
                        <p className="text-sm text-gray-400 mt-1">{tx('verifyIdentity.fileFormatHint', undefined, 'JPG, PNG (Max 5MB)')}</p>
                    </button>
                )}

                {fileMeta && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        <FileCheck2 className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                        <span>{fileMeta.name}</span>
                        <span className="text-gray-500 dark:text-gray-300">({fileMeta.sizeKB}KB)</span>
                    </div>
                )}
                {errorMessage && <p className="mt-3 text-sm text-red-600 dark:text-red-300">{errorMessage}</p>}

                <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    capture={captureMode}
                    onChange={e => { const file = e.target.files?.[0]; if (file) onFileSelect(file); }}
                    className="hidden"
                />
            </div>

            <div className="flex items-center justify-between">
                {onBack ? (
                    <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <ChevronRight className="ms-1 w-5 h-5 rtl:rotate-180" />
                        {t.common.back}
                    </button>
                ) : <div />}

                <button
                    onClick={onNext}
                    disabled={!canProceed || isUploading}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                >
                    {isUploading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />{tx('verifyIdentity.processing', undefined, 'Processing...')}</>
                    ) : t.common.next}
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
            </div>
        </div>
    );
}
