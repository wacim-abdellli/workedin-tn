import type { RefObject } from 'react';
import { useTranslation } from '@/i18n';
import { fmtSize } from './contractUtils';

interface FilePreviewModalProps {
  file: { name: string; senderName?: string; uploadedAt?: string; size?: number | string | null; url?: string } | null;
  onClose: () => void;
  onOpenFile?: (file: { url?: string }) => void;
  closeRef?: RefObject<HTMLButtonElement | null>;
}

export default function FilePreviewModal({
  file,
  onClose,
  onOpenFile,
  closeRef,
}: FilePreviewModalProps) {
  const { tx } = useTranslation();

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={tx('pages.messages.contractDetails.filePreviewAria')}>
      <div className="w-full max-w-lg rounded-[14px] bg-[#111214] border border-white/[0.08] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500">{tx('pages.messages.contractDetails.filePreview')}</p>
            <h2 className="mt-1 truncate text-[18px] font-medium tracking-[-0.01em] text-white">{file.name}</h2>
            <p className="font-mono text-[13px] text-zinc-400">
              {[file.senderName || tx('pages.messages.contractDetails.clientFallback'), file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : tx('pages.messages.contractDetails.unknownDate'), fmtSize(file.size)].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button type="button" ref={closeRef} onClick={onClose} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[14px] font-medium text-zinc-400 transition-colors hover:border-white/[0.12] hover:text-white">{tx('pages.messages.contractDetails.close')}</button>
        </div>
        <div className="mt-4 rounded-[10px] border border-white/[0.07] bg-[#0c0c0e] px-4 py-[14px]">
          <p className="text-[14px] leading-[1.6] text-zinc-400">
            {tx('pages.messages.contractDetails.previewOverlayDesc')}
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[14px] font-medium text-zinc-400 transition-colors hover:border-white/[0.12] hover:text-white">{tx('pages.messages.contractDetails.cancel')}</button>
          <button type="button" onClick={() => {
            if (onOpenFile) {
              onOpenFile(file);
            } else {
              if (file.url) window.open(file.url, '_blank', 'noopener');
            }
            onClose();
          }} className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-[14px] font-medium text-[#0A0A0B] transition-colors">{tx('pages.messages.contractDetails.openFile')}</button>
        </div>
      </div>
    </div>
  );
}
