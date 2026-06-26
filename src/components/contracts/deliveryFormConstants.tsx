import { ExternalLink, FileSpreadsheet, Globe, Link as LinkIcon, Video } from 'lucide-react';
import type { DeliveryLink } from './types';

export const CATEGORY_HINTS: Record<string, { review: string; final: string; icon: string }> = {
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

export const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
};

export const isSourceFile = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['zip', 'rar', '7z', 'tar', 'gz', 'ai', 'psd', 'fig', 'sketch', 'xd', 'indd'].includes(ext);
};

export function GithubIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
    );
}

export function VideoIcon(props: any) {
    return <Video className="h-3.5 w-3.5" {...props} />;
}

export const CATEGORIES = [
    { value: 'github' as const, label: 'GitHub / GitLab', icon: GithubIcon, color: 'text-violet-400 border-violet-500/20 bg-violet-500/10' },
    { value: 'vercel' as const, label: 'Staging / Preview', icon: ExternalLink, color: 'text-sky-400 border-sky-500/20 bg-sky-500/10' },
    { value: 'figma' as const, label: 'Figma Design', icon: Globe, color: 'text-pink-400 border-pink-500/20 bg-pink-500/10' },
    { value: 'drive' as const, label: 'Google Drive / Cloud', icon: FileSpreadsheet, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
    { value: 'loom' as const, label: 'Loom Walkthrough', icon: VideoIcon, color: 'text-orange-400 border-orange-500/20 bg-orange-500/10' },
    { value: 'other' as const, label: 'Other URL', icon: LinkIcon, color: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10' },
] as const;
