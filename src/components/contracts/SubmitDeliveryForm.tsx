import { useRef, useState, type Ref } from 'react';
import { 
    CheckCircle, 
    Loader2, 
    PackageCheck, 
    Paperclip, 
    Trash2, 
    Upload, 
    Link as LinkIcon, 
    Globe, 
    _Lock, 
    ExternalLink,
    PlusCircle,
    Info,
    FileSpreadsheet,
    FileArchive,
    Video,
    ShieldAlert
} from 'lucide-react';

type DeliveryLink = {
    url: string;
    label: string;
    category: 'github' | 'figma' | 'drive' | 'loom' | 'vercel' | 'other';
    link_kind: 'review_link' | 'final_link';
    credentials?: string;
};

type Milestone = {
    id: string;
    description: string;
    amount: number;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    due_date?: string;
};

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
    onSubmit: (links: DeliveryLink[], fileStages: Record<number, 'review' | 'final'>) => void;
    onCancel: () => void;
    jobCategory?: string | null;
    milestones?: Milestone[];
    selectedMilestoneId?: string;
    onMilestoneChange?: (id: string) => void;
    isUploadPaused?: boolean;
    onPauseUpload?: () => void;
    onResumeUpload?: () => void;
    uploadProgress?: { current: number; total: number; currentBytes: number; totalBytes: number };
    uploadingFileName?: string | null;
    tusProgress?: number;
};

const CATEGORY_HINTS: Record<string, { review: string; final: string; icon: string }> = {
    development: {
        review: "Vercel preview, Netlify link, staging URL, or Loom walkthrough of active features",
        final: "Production repository URL, Vercel production deployment, credentials, or final build package",
        icon: "💻"
    },
    design: {
        review: "Figma View link (read-only), draft exports, or watermarked image renders",
        final: "Figma Edit/Duplicate link, raw source assets (.fig, .ai, .psd), or high-res vector exports",
        icon: "🎨"
    },
    writing: {
        review: "Google Doc with Comment-only access, draft manuscript, or watermarked PDF draft",
        final: "Google Doc with Edit access, production-ready markdown source, or final Word/PDF outputs",
        icon: "✍️"
    },
    video: {
        review: "Watermarked preview video link (Loom, YouTube unlisted), or low-resolution MP4 draft",
        final: "High-resolution final video source files via Google Drive, or final MP4/MOV assets",
        icon: "🎬"
    }
};

const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
};

const CATEGORIES = [
    { value: 'github', label: 'GitHub / GitLab', icon: GithubIcon, color: 'text-violet-400 border-violet-500/20 bg-violet-500/10' },
    { value: 'vercel', label: 'Staging / Preview', icon: ExternalLink, color: 'text-sky-400 border-sky-500/20 bg-sky-500/10' },
    { value: 'figma', label: 'Figma Design', icon: Globe, color: 'text-pink-400 border-pink-500/20 bg-pink-500/10' },
    { value: 'drive', label: 'Google Drive / Cloud', icon: FileSpreadsheet, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
    { value: 'loom', label: 'Loom Walkthrough', icon: VideoIcon, color: 'text-orange-400 border-orange-500/20 bg-orange-500/10' },
    { value: 'other', label: 'Other URL', icon: LinkIcon, color: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10' },
] as const;

// Custom Github Icon wrapper
function GithubIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
    );
}

// Custom Video Icon wrapper
function VideoIcon(props: any) {
    return <Video className="h-3.5 w-3.5" {...props} />;
}

const isSourceFile = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['zip', 'rar', '7z', 'tar', 'gz', 'ai', 'psd', 'fig', 'sketch', 'xd', 'indd'].includes(ext);
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
    jobCategory,
    milestones,
    selectedMilestoneId,
    onMilestoneChange,
    isUploadPaused = false,
    onPauseUpload,
    onResumeUpload,
    uploadProgress,
    uploadingFileName = null,
    tusProgress,
}: SubmitDeliveryFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Links State
    const [links, setLinks] = useState<DeliveryLink[]>([]);
    const [newUrl, setNewUrl] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newCategory, setNewCategory] = useState<DeliveryLink['category']>('github');
    const [newKind, setNewKind] = useState<DeliveryLink['link_kind']>('review_link');
    const [newCredentials, setNewCredentials] = useState('');
    const [linkError, setLinkError] = useState<string | null>(null);

    // File stages mapping: index -> 'review' | 'final'
    const [fileStages, setFileStages] = useState<Record<number, 'review' | 'final'>>({});

    const getFileStage = (index: number, name: string): 'review' | 'final' => {
        if (fileStages[index]) return fileStages[index];
        return isSourceFile(name) ? 'final' : 'review';
    };

    const handleToggleFileStage = (index: number, name: string) => {
        const current = getFileStage(index, name);
        setFileStages(prev => ({
            ...prev,
            [index]: current === 'review' ? 'final' : 'review'
        }));
    };

    const handleAddLink = () => {
        setLinkError(null);
        
        const trimmedUrl = newUrl.trim();
        if (!trimmedUrl) {
            setLinkError('URL is required');
            return;
        }

        if (!/^https?:\/\/\S+\.\S+/.test(trimmedUrl)) {
            setLinkError('Please enter a valid URL (starting with http:// or https://)');
            return;
        }

        const label = newLabel.trim() || CATEGORIES.find(c => c.value === newCategory)?.label || 'Link';

        const newLinkItem: DeliveryLink = {
            url: trimmedUrl,
            label,
            category: newCategory,
            link_kind: newKind,
            credentials: newKind === 'final_link' && newCredentials.trim() ? newCredentials.trim() : undefined,
        };

        setLinks(prev => [...prev, newLinkItem]);
        setNewUrl('');
        setNewLabel('');
        setNewCredentials('');
        setNewCategory('github');
    };

    const handleRemoveLink = (indexToRemove: number) => {
        setLinks(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleToggleLinkKind = (index: number) => {
        setLinks(prev => prev.map((l, idx) => {
            if (idx !== index) return l;
            const nextKind = l.link_kind === 'review_link' ? 'final_link' : 'review_link';
            return {
                ...l,
                link_kind: nextKind,
                credentials: nextKind === 'review_link' ? undefined : l.credentials
            };
        }));
    };

    const handleLinkCredentialsChange = (index: number, value: string) => {
        setLinks(prev => prev.map((l, idx) => {
            if (idx !== index) return l;
            return {
                ...l,
                credentials: value.trim() ? value : undefined
            };
        }));
    };

    // Validation Logic
    const hasReview = files.some((f, idx) => getFileStage(idx, f.name) === 'review') || 
                      links.some(l => l.link_kind === 'review_link');
                      
    const hasFinal = files.some((f, idx) => getFileStage(idx, f.name) === 'final') || 
                     links.some(l => l.link_kind === 'final_link');
                     
    const canSubmit = hasReview && hasFinal && !isSubmitting && (!milestones || milestones.length === 0 || !!selectedMilestoneId);

    const handleSubmitClick = () => {
        // Build the complete file stages dictionary, filling in defaults
        const finalFileStages: Record<number, 'review' | 'final'> = {};
        files.forEach((f, idx) => {
            finalFileStages[idx] = getFileStage(idx, f.name);
        });
        onSubmit(links, finalFileStages);
    };

    return (
        <div className="space-y-4">
            {/* Header Title Section */}
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300">
                    <PackageCheck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Delivery package</p>
                    <h2 className="text-[16px] font-semibold leading-tight text-zinc-100">Submit completed work</h2>
                    <p className="mt-1 text-[12px] leading-[1.45] text-zinc-400">
                        Drop deliverables and set their lock stages. Review drafts remain visible, final source assets are locked in escrow.
                    </p>
                </div>
            </div>

            {jobCategory && CATEGORY_HINTS[jobCategory.toLowerCase()] && (() => {
                const hint = CATEGORY_HINTS[jobCategory.toLowerCase()];
                return (
                    <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.02] p-3 text-xs text-zinc-300">
                        <div className="flex items-center gap-2 mb-2 select-none">
                            <span className="text-sm">{hint.icon}</span>
                            <span className="font-bold text-violet-300 uppercase tracking-wider text-[9px]">
                                {jobCategory} Hints & Best Practices
                            </span>
                        </div>
                        <div className="space-y-1 text-zinc-400">
                            <div className="flex items-start gap-1.5">
                                <span className="text-emerald-400 shrink-0 font-semibold">🔓 Review:</span>
                                <span className="leading-normal">{hint.review}</span>
                            </div>
                            <div className="flex items-start gap-1.5 mt-1.5">
                                <span className="text-amber-400 shrink-0 font-semibold">🔒 Final:</span>
                                <span className="leading-normal">{hint.final}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {milestones && milestones.length > 0 && (
                <div className="rounded-xl border border-white/[0.04] bg-[#0A0A0B] p-3.5 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 select-none">
                        <Info className="h-3.5 w-3.5 text-violet-400/80" />
                        Select Milestone for this Delivery
                    </label>
                    <select
                        value={selectedMilestoneId}
                        onChange={(e) => onMilestoneChange?.(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.06] bg-zinc-950 px-3.5 py-2 text-[12px] text-zinc-200 outline-none focus:border-violet-500/50 transition-all cursor-pointer"
                    >
                        <option value="">-- Select target milestone --</option>
                        {milestones.map((m) => (
                            <option key={m.id} value={m.id} disabled={m.status === 'approved'}>
                                {m.description} ({m.amount} TND) {m.status === 'approved' ? '✓ Paid' : `[${m.status.toUpperCase()}]`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {actionError ? (
                <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                    {actionError}
                </div>
            ) : null}

            {/* Note to Client */}
            <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-zinc-300">Note to client</span>
                <textarea
                    ref={textareaRef}
                    value={deliveryNote}
                    onChange={(event) => onNoteChange(event.target.value)}
                    rows={2.5}
                    className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#0b0b0d] px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/20"
                    placeholder={notePlaceholder}
                    aria-label="Delivery note"
                />
            </label>

            {/* Unified Upload Dashboard Card or Progress Card */}
            {isSubmitting ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0B] p-4.5 space-y-3.5 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <Loader2 className={`h-5 w-5 text-violet-400 shrink-0 ${isUploadPaused ? '' : 'animate-spin'}`} />
                            <div className="min-w-0">
                                <h4 className="text-[13px] font-bold text-zinc-150">
                                    {isUploadPaused ? 'Upload Paused' : 'Uploading deliverables...'}
                                </h4>
                                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                    {uploadingFileName ? `Uploading: ${uploadingFileName}` : 'Preparing files...'}
                                </p>
                            </div>
                        </div>
                        {onPauseUpload && onResumeUpload && uploadingFileName && (
                            <button
                                type="button"
                                onClick={isUploadPaused ? onResumeUpload : onPauseUpload}
                                className="rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 shrink-0 transition-colors"
                            >
                                {isUploadPaused ? '▶ Resume' : '⏸ Pause'}
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-zinc-400">
                            <span>
                                {uploadProgress ? `File ${uploadProgress.current} of ${uploadProgress.total}` : 'Progress'}
                            </span>
                            <span className="font-mono">
                                {((tusProgress !== undefined && tusProgress > 0) ? tusProgress : (uploadProgress && uploadProgress.totalBytes > 0 ? Math.round((uploadProgress.currentBytes / uploadProgress.totalBytes) * 100) : 0))}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-white/[0.03]">
                            <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                                style={{ width: `${((tusProgress !== undefined && tusProgress > 0) ? tusProgress : (uploadProgress && uploadProgress.totalBytes > 0 ? Math.round((uploadProgress.currentBytes / uploadProgress.totalBytes) * 100) : 0))}%` }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5 space-y-4">
                    
                    {/* 1. Drag & Drop Files Uploader */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.12] bg-[#070709] px-4 py-3.5 text-center transition-colors hover:border-violet-400/40 hover:bg-violet-500/[0.03] disabled:opacity-50"
                    >
                        <Upload className="h-4.5 w-4.5 text-violet-300/80" />
                        <span className="text-[12px] font-medium text-zinc-200">Drag & drop or browse files</span>
                        <span className="text-[10px] text-zinc-500">Supports slides, code packages, vectors, and videos (Max 100MB)</span>
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

                    {/* 2. Link Injector Form */}
                    <div className="space-y-2 rounded-lg border border-white/[0.05] bg-black/40 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Add Deliverable Link</p>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="text-[10px] text-zinc-500">Category</span>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as DeliveryLink['category'])}
                                    className="mt-1 w-full rounded-md border border-white/[0.08] bg-[#070709] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-violet-400/50"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-[10px] text-zinc-500">Release Stage</span>
                                <select
                                    value={newKind}
                                    onChange={(e) => setNewKind(e.target.value as DeliveryLink['link_kind'])}
                                    className="mt-1 w-full rounded-md border border-white/[0.08] bg-[#070709] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-violet-400/50"
                                >
                                    <option value="review_link">🔓 For Review (Staging/Preview)</option>
                                    <option value="final_link">🔒 Final Hand-off (Escrow Locked)</option>
                                </select>
                            </label>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4">
                                <span className="text-[10px] text-zinc-500">Label / Name</span>
                                <input
                                    type="text"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="e.g. Figma System"
                                    className="mt-1 w-full rounded-md border border-white/[0.08] bg-[#070709] px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-650 focus:border-violet-400/50"
                                />
                            </div>
                            <div className="col-span-8">
                                <span className="text-[10px] text-zinc-500">URL</span>
                                <div className="mt-1 flex gap-1.5">
                                    <input
                                        type="text"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full rounded-md border border-white/[0.08] bg-[#070709] px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-650 focus:border-violet-400/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddLink}
                                        className="flex items-center justify-center rounded-md bg-violet-650/20 px-3 text-violet-300 border border-violet-500/20 hover:bg-violet-600/40 active:scale-95 transition-all"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {newKind === 'final_link' && (
                            <label className="block">
                                <span className="text-[10px] text-zinc-500">Escrow Locked Credentials / Access Keys</span>
                                <textarea
                                    value={newCredentials}
                                    onChange={(e) => setNewCredentials(e.target.value)}
                                    placeholder="e.g. Login user & password (hidden securely until escrow payment approval)"
                                    rows={1.5}
                                    className="mt-1 w-full resize-none rounded-md border border-white/[0.08] bg-[#070709] px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-650 focus:border-violet-400/50"
                                />
                            </label>
                        )}

                        {linkError && (
                            <p className="text-[10.5px] text-red-300 mt-1 flex items-center gap-1">
                                <Info className="h-3 w-3 shrink-0" /> {linkError}
                            </p>
                        )}
                    </div>

                    {/* 3. Consolidated Unified Deliverables List */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Deliverables Pack ({files.length + links.length})</p>
                        
                        {files.length > 0 || links.length > 0 ? (
                            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                                
                                {/* File Deliverables */}
                                {files.map((file, index) => {
                                    const stage = getFileStage(index, file.name);
                                    const isSource = isSourceFile(file.name);
                                    const isReviewLeak = stage === 'review' && isSource;

                                    return (
                                        <div key={`file-${file.name}-${index}`} className="flex flex-col gap-1.5 rounded-lg border border-white/[0.04] bg-[#070709] p-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    {isSource ? (
                                                        <FileArchive className="h-4 w-4 shrink-0 text-violet-300" />
                                                    ) : (
                                                        <Paperclip className="h-4 w-4 shrink-0 text-zinc-400" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[12px] font-medium text-zinc-250 truncate leading-none">{file.name}</p>
                                                        <p className="mt-1 text-[10px] text-zinc-500 leading-none">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Stage Toggle Switch */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleFileStage(index, file.name)}
                                                        className={`rounded px-2 py-0.8 text-[10px] font-semibold border transition-all ${
                                                            stage === 'review' 
                                                                ? 'border-violet-500/20 bg-violet-500/10 text-violet-300' 
                                                                : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                                                        }`}
                                                    >
                                                        {stage === 'review' ? '🔓 Review' : '🔒 Final'}
                                                    </button>

                                                    {/* Remove file */}
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoveFile(index)}
                                                        disabled={isSubmitting}
                                                        className="rounded p-0.5 text-zinc-500 hover:bg-white/[0.06] hover:text-red-300"
                                                        aria-label={`Remove ${file.name}`}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* IP Leakage Warning Alert Panel */}
                                            {isReviewLeak && (
                                                <div className="flex items-start gap-1.5 rounded bg-amber-500/10 border border-amber-500/20 p-1.5 text-[9.5px] leading-tight text-amber-300">
                                                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                                                    <div>
                                                        <strong className="font-semibold">IP Theft Risk:</strong> You are exposing raw source code/assets (`${file.name.split('.').pop()}`) in the Review phase. The client can download this immediately without releasing escrow. 
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleToggleFileStage(index, file.name)}
                                                            className="ml-1 text-zinc-100 hover:text-white font-bold underline"
                                                        >
                                                            Protect Asset (Lock final)
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Link Deliverables */}
                                {links.map((link, index) => {
                                    const categoryInfo = CATEGORIES.find(c => c.value === link.category) || CATEGORIES[5];
                                    const CategoryIcon = categoryInfo.icon;

                                    return (
                                        <div key={`link-${link.url}-${index}`} className="flex flex-col gap-2 rounded-lg border border-white/[0.04] bg-[#070709] p-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${categoryInfo.color}`}>
                                                        <CategoryIcon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[12px] font-medium text-zinc-250 truncate leading-none">{link.label}</p>
                                                        <p className="mt-1 text-[10px] text-zinc-500 truncate leading-none">{link.url}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Stage Toggle Switch */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleLinkKind(index)}
                                                        className={`rounded px-2 py-0.8 text-[10px] font-semibold border transition-all ${
                                                            link.link_kind === 'review_link' 
                                                                ? 'border-violet-500/20 bg-violet-500/10 text-violet-300' 
                                                                : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                                                        }`}
                                                    >
                                                        {link.link_kind === 'review_link' ? '🔓 Review' : '🔒 Final'}
                                                    </button>

                                                    {/* Remove link */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLink(index)}
                                                        className="rounded p-0.5 text-zinc-500 hover:bg-white/[0.06] hover:text-red-300"
                                                        aria-label={`Remove link ${link.label}`}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Credentials text area inline inside final links */}
                                            {link.link_kind === 'final_link' && (
                                                <div className="border-t border-white/[0.03] pt-1.5 mt-0.5">
                                                    <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Access Info / Credentials (Optional)</span>
                                                    <input
                                                        type="text"
                                                        value={link.credentials || ''}
                                                        onChange={(e) => handleLinkCredentialsChange(index, e.target.value)}
                                                        placeholder="Login credentials or keys (hidden in escrow)"
                                                        className="mt-1 w-full rounded border border-white/[0.06] bg-black/20 px-2 py-1 text-[11px] text-zinc-300 outline-none placeholder:text-zinc-650 focus:border-violet-400/40"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-[11px] py-6 text-zinc-500 border border-dashed border-white/[0.06] rounded-lg bg-black/20">
                                No files or external links added yet.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Validation Indicator Notice Box */}
            <div className="rounded-lg border border-white/[0.04] bg-black/40 p-2.5">
                <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-violet-300" />
                    <div className="text-[11px] leading-tight text-zinc-400 space-y-1">
                        <p className="font-semibold text-zinc-300">Validation Checklist:</p>
                        <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${hasReview ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span>Client Review (Staging/Preview): {hasReview ? 'Ready' : 'Required (mark an item as review)'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${hasFinal ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span>Final Hand-off (Locked): {hasFinal ? 'Ready' : 'Required (mark an item as final)'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submitting Actions Buttons */}
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-[12px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-1.5 text-[12px] font-semibold text-[#0a0a0b] transition-colors hover:bg-white disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    {isSubmitting ? (uploadProgressLabel || submittingLabel) : submitLabel}
                </button>
            </div>
        </div>
    );
}
