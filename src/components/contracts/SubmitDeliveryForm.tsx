import { useRef, type Ref } from 'react';
import { CheckCircle, Loader2, PackageCheck, Paperclip, Trash2, Upload } from 'lucide-react';

type SubmitDeliveryFormProps = {
    deliveryNote: string;
    files: File[];
    isSubmitting: boolean;
    actionError?: string | null;
    submitLabel?: string;
    submittingLabel?: string;
    uploadProgressLabel?: string | null;
    notePlaceholder?: string;
    textareaRef?: Ref<HTMLTextAreaElement>;
    onNoteChange: (value: string) => void;
    onAddFiles: (files: File[]) => void;
    onRemoveFile: (index: number) => void;
    onSubmit: () => void;
    onCancel: () => void;
};

const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
};

export default function SubmitDeliveryForm({
    deliveryNote,
    files,
    isSubmitting,
    actionError,
    submitLabel = 'Submit delivery',
    submittingLabel = 'Submitting...',
    uploadProgressLabel,
    notePlaceholder = "Describe what you've completed, any important notes for the client...",
    textareaRef,
    onNoteChange,
    onAddFiles,
    onRemoveFile,
    onSubmit,
    onCancel,
}: SubmitDeliveryFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canSubmit = files.length > 0 && !isSubmitting;

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300">
                    <PackageCheck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Delivery package</p>
                    <h2 className="text-[16px] font-semibold leading-tight text-zinc-100">Submit completed work</h2>
                    <p className="mt-1 text-[12px] leading-[1.45] text-zinc-400">
                        Attach the files the client should review. Payment stays in escrow until the client accepts.
                    </p>
                </div>
            </div>

            {actionError ? (
                <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                    {actionError}
                </div>
            ) : null}

            <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-zinc-300">Note to client</span>
                <textarea
                    ref={textareaRef}
                    value={deliveryNote}
                    onChange={(event) => onNoteChange(event.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#0b0b0d] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/20"
                    placeholder={notePlaceholder}
                    aria-label="Delivery note"
                />
            </label>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.018] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[12px] font-semibold text-zinc-100">Delivery files</p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">One clear file set for review, revisions, and final handoff.</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-500">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                </div>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.12] bg-[#0b0b0d] px-4 py-5 text-center transition-colors hover:border-violet-400/40 hover:bg-violet-500/[0.04] disabled:opacity-50"
                >
                    <Upload className="h-5 w-5 text-violet-300/80" />
                    <span className="text-[13px] font-medium text-zinc-200">Add delivery files</span>
                    <span className="text-[11px] text-zinc-500">Max 100 MB per file</span>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                        const selectedFiles = Array.from(event.currentTarget.files ?? []);
                        if (selectedFiles.length > 0) onAddFiles(selectedFiles);
                        event.currentTarget.value = '';
                    }}
                />

                {files.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                        {files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-[#0b0b0d] px-2.5 py-2">
                                <Paperclip className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                                <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-200">{file.name}</span>
                                <span className="shrink-0 text-[11px] text-zinc-500">{formatFileSize(file.size)}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveFile(index)}
                                    disabled={isSubmitting}
                                    className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-red-300 disabled:opacity-50"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2 text-[12px] text-amber-300">Add at least one delivery file to submit.</p>
                )}
            </div>

            <div className="rounded-lg border border-white/[0.05] bg-[#0b0b0d] px-3 py-2">
                <p className="text-[12px] leading-[1.45] text-zinc-400">
                    The client can review these files after submission. If changes are requested, you can resubmit a new delivery package.
                </p>
            </div>

            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3.5 py-2 text-[13px] font-semibold text-[#0a0a0b] transition-colors hover:bg-white disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {isSubmitting ? (uploadProgressLabel || submittingLabel) : submitLabel}
                </button>
            </div>
        </div>
    );
}
