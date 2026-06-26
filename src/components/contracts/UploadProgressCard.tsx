import { Loader2 } from 'lucide-react';

type UploadProgressCardProps = {
    isUploadPaused: boolean;
    uploadingFileName: string | null;
    onPauseUpload?: () => void;
    onResumeUpload?: () => void;
    uploadProgress?: { current: number; total: number; currentBytes: number; totalBytes: number };
    tusProgress?: number;
};

export default function UploadProgressCard({
    isUploadPaused,
    uploadingFileName,
    onPauseUpload,
    onResumeUpload,
    uploadProgress,
    tusProgress,
}: UploadProgressCardProps) {
    const progress = (tusProgress !== undefined && tusProgress > 0)
        ? tusProgress
        : (uploadProgress && uploadProgress.totalBytes > 0
            ? Math.round((uploadProgress.currentBytes / uploadProgress.totalBytes) * 100)
            : 0);

    return (
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

            <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>
                        {uploadProgress ? `File ${uploadProgress.current} of ${uploadProgress.total}` : 'Progress'}
                    </span>
                    <span className="font-mono">{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-white/[0.03]">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
