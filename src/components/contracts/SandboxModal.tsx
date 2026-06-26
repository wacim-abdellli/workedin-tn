import { useTranslation } from '@/i18n';
import { Globe } from 'lucide-react';

interface SandboxModalProps {
  url: string | null;
  label: string;
  viewport: 'desktop' | 'tablet' | 'mobile';
  onClose: () => void;
  onViewportChange: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
}

export default function SandboxModal({
  url,
  label,
  viewport,
  onClose,
  onViewportChange,
}: SandboxModalProps) {
  const { tx } = useTranslation();

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden w-full max-w-5xl h-[85vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="h-5 w-5 text-violet-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-zinc-100 truncate">{label}</h3>
              <p className="text-[10px] text-zinc-550 font-mono truncate">{url}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#070709] p-1">
            <button
              type="button"
              onClick={() => onViewportChange('desktop')}
              className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-all ${viewport === 'desktop' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {tx('pages.messages.contractDetails.desktop')}
            </button>
            <button
              type="button"
              onClick={() => onViewportChange('tablet')}
              className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-all ${viewport === 'tablet' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {tx('pages.messages.contractDetails.tablet')}
            </button>
            <button
              type="button"
              onClick={() => onViewportChange('mobile')}
              className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-all ${viewport === 'mobile' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {tx('pages.messages.contractDetails.mobile')}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] font-semibold text-zinc-305 hover:bg-white/[0.06] hover:text-white transition-all"
          >
            {tx('pages.messages.contractDetails.close')}
          </button>
        </div>

        <div className="flex-1 bg-zinc-950/40 p-6 flex items-center justify-center overflow-auto">
          {viewport === 'desktop' ? (
            <div className="w-full h-full flex flex-col border border-white/[0.08] bg-[#0c0c0e] rounded-xl overflow-hidden shadow-2xl transition-all duration-300">
              <div className="h-9 shrink-0 bg-zinc-900/90 border-b border-white/[0.05] px-4 flex items-center gap-3 select-none">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>
                <div className="flex items-center gap-1 text-zinc-550 shrink-0 text-[10px]">
                  <span className="p-1 rounded hover:bg-white/5 cursor-pointer">←</span>
                  <span className="p-1 rounded hover:bg-white/5 cursor-pointer">→</span>
                  <span className="p-1 rounded hover:bg-white/5 cursor-pointer">⟳</span>
                </div>
                <div className="flex-grow max-w-xl mx-auto h-6 bg-zinc-950/60 rounded border border-white/[0.05] flex items-center px-3 gap-2 text-[10px] text-zinc-400 font-mono truncate select-all">
                  <Globe className="h-3 w-3 text-zinc-500 shrink-0" />
                  {url}
                </div>
              </div>
              <iframe
                src={url}
                title={tx('pages.messages.contractDetails.stagingSandboxPreview')}
                className="w-full flex-grow border-none bg-white"
              />
            </div>
          ) : viewport === 'tablet' ? (
            <div className="w-[768px] h-full max-h-[720px] flex flex-col border-[12px] border-zinc-800 bg-zinc-900 rounded-[28px] overflow-hidden shadow-2xl relative transition-all duration-305 shrink-0">
              <div className="h-6 shrink-0 bg-zinc-900 px-6 flex items-center justify-between text-[9px] font-bold text-zinc-400 select-none">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <span>📶</span>
                  <span>🛜</span>
                  <span>100% 🔋</span>
                </div>
              </div>
              <iframe
                src={url}
                title={tx('pages.messages.contractDetails.stagingSandboxPreview')}
                className="w-full flex-grow border-none bg-white"
              />
              <div className="h-3 shrink-0 bg-zinc-900 flex items-center justify-center">
                <div className="w-32 h-1 bg-zinc-700 rounded-full" />
              </div>
            </div>
          ) : (
            <div className="w-[375px] h-full max-h-[660px] flex flex-col border-[12px] border-zinc-800 bg-zinc-900 rounded-[44px] overflow-hidden shadow-2xl relative transition-all duration-305 shrink-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-end px-3">
                <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full border border-zinc-800/40" />
              </div>
              <div className="h-9 shrink-0 bg-zinc-900 px-6 flex items-end pb-1.5 justify-between text-[9px] font-bold text-zinc-400 select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span>📶</span>
                  <span>5G</span>
                  <span>🔋</span>
                </div>
              </div>
              <iframe
                src={url}
                title={tx('pages.messages.contractDetails.stagingSandboxPreview')}
                className="w-full flex-grow border-none bg-white"
              />
              <div className="h-4 shrink-0 bg-zinc-900 flex items-center justify-center pb-1">
                <div className="w-28 h-1 bg-zinc-700 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
