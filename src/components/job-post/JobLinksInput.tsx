import { useMemo, useState } from 'react';
import {
  Box,
  Facebook,
  Figma,
  FolderOpen,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Palette,
  Plus,
  Trash2,
  Twitter,
  Youtube,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  getJobReferenceLinkMeta,
  MAX_JOB_REFERENCE_LINKS,
  normalizeJobReferenceLink,
  sanitizeJobReferenceLinks,
  type JobLinkPlatform,
} from '../../lib/jobLinks';

interface JobLinksInputProps {
  value?: string[];
  onChange: (links: string[]) => void;
  maxLinks?: number;
}

const PLATFORM_STYLE: Record<JobLinkPlatform, string> = {
  google_drive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  linkedin: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  github: 'bg-zinc-400/15 text-zinc-200 border-zinc-400/25',
  youtube: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  instagram: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
  facebook: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  x: 'bg-slate-500/15 text-slate-200 border-slate-500/25',
  tiktok: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  dropbox: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  behance: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  figma: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  website: 'bg-white/10 text-[var(--color-text-primary)]/80 border-white/15',
};

function PlatformIcon({ platform }: { platform: JobLinkPlatform }) {
  if (platform === 'google_drive') return <FolderOpen className="h-4 w-4" />;
  if (platform === 'linkedin') return <Linkedin className="h-4 w-4" />;
  if (platform === 'github') return <Github className="h-4 w-4" />;
  if (platform === 'youtube') return <Youtube className="h-4 w-4" />;
  if (platform === 'instagram') return <Instagram className="h-4 w-4" />;
  if (platform === 'facebook') return <Facebook className="h-4 w-4" />;
  if (platform === 'x') return <Twitter className="h-4 w-4" />;
  if (platform === 'tiktok') return <Box className="h-4 w-4" />;
  if (platform === 'dropbox') return <Box className="h-4 w-4" />;
  if (platform === 'behance') return <Palette className="h-4 w-4" />;
  if (platform === 'figma') return <Figma className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

export default function JobLinksInput({
  value = [],
  onChange,
  maxLinks = MAX_JOB_REFERENCE_LINKS,
}: JobLinksInputProps) {
  const { tx } = useTranslation();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const normalizedLinks = useMemo(() => sanitizeJobReferenceLinks(value, maxLinks), [maxLinks, value]);

  const addDraftLink = () => {
    const candidate = draft.trim();
    if (!candidate) return;

    const withNewLink = sanitizeJobReferenceLinks([...normalizedLinks, candidate], maxLinks);

    if (withNewLink.length === normalizedLinks.length) {
      const normalizedCandidate = normalizeJobReferenceLink(candidate);
      const alreadyExists = normalizedCandidate
        ? normalizedLinks.some((existing) => existing.toLowerCase() === normalizedCandidate.toLowerCase())
        : false;

      if (normalizedLinks.length >= maxLinks) {
        setError(
          tx(
            'jobs.new.links.maxLinksReached',
            { count: maxLinks },
            `You can add up to ${maxLinks} links.`,
          ),
        );
      } else if (alreadyExists) {
        setError(tx('jobs.new.links.duplicate', undefined, 'This link was already added.'));
      } else {
        setError(tx('jobs.new.links.invalid', undefined, 'Please enter a valid URL.'));
      }

      return;
    }

    onChange(withNewLink);
    setDraft('');
    setError('');
  };

  const removeLink = (target: string) => {
    onChange(normalizedLinks.filter((item) => item !== target));
    setError('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {tx('jobs.new.links.title', undefined, 'Reference links (optional)')}
          </p>
          <p className="text-xs text-[#a3a3a3] mt-1 leading-5">
            {tx(
              'jobs.new.links.description',
              undefined,
              'Add Google Drive, portfolio, or social links so freelancers can review context quickly.',
            )}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-[var(--color-bg-elevated)] px-2.5 py-1 text-[11px] text-[#b8b8b8]">
          {normalizedLinks.length} / {maxLinks}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addDraftLink();
            }
          }}
          placeholder={tx(
            'jobs.new.links.placeholder',
            undefined,
            'Paste link (e.g. drive.google.com/... or linkedin.com/in/...)',
          )}
          className="w-full rounded-2xl border border-orange-500/20 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-primary)] caret-orange-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none ring-1 ring-orange-500/5 transition-all duration-200 placeholder:text-orange-100/42 hover:border-orange-400/40 hover:bg-amber-500/10 hover:ring-orange-500/10 focus:border-orange-400 focus:bg-amber-500/10 focus:ring-4 focus:ring-orange-500/20"
        />
        <button
          type="button"
          onClick={addDraftLink}
          disabled={!draft.trim() || normalizedLinks.length >= maxLinks}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-500/40 bg-orange-500/10 px-3.5 py-3 text-sm font-medium text-orange-200 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {tx('jobs.new.links.add', undefined, 'Add link')}
        </button>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {normalizedLinks.length > 0 ? (
        <div className="space-y-2">
          {normalizedLinks.map((link) => {
            const meta = getJobReferenceLinkMeta(link);
            if (!meta) return null;

            return (
              <div
                key={link}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[var(--color-bg-elevated)] px-3 py-2.5"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${PLATFORM_STYLE[meta.platform]}`}>
                    <PlatformIcon platform={meta.platform} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{meta.platformLabel}</p>
                    <p className="truncate text-xs text-[#8f8f8f]">{meta.hostname}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeLink(link)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9f9f9f] transition hover:bg-white/5 hover:text-red-300"
                  aria-label={tx('jobs.new.links.remove', undefined, 'Remove link')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}



