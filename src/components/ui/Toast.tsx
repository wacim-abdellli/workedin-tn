import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useTranslation } from '../../i18n';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'bottom-center';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  position: ToastPosition;
  duration: number;
}

interface ToastOptions {
  position?: ToastPosition;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: React.ReactNode; title: string; accentClass: string; cardClass: string }> = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    title: 'Success',
    accentClass: 'text-emerald-400',
    cardClass: 'border-emerald-500/25 bg-[#11211e]',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-red-400" />,
    title: 'Error',
    accentClass: 'text-red-400',
    cardClass: 'border-red-500/25 bg-[#24161b]',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    title: 'Warning',
    accentClass: 'text-amber-400',
    cardClass: 'border-amber-500/25 bg-[#241f14]',
  },
  info: {
    icon: <Info className="h-5 w-5 text-primary-400" />,
    title: 'Info',
    accentClass: 'text-primary-400',
    cardClass: 'border-primary-500/25 bg-[#171b28]',
  },
};

const positionClassMap: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4 items-end',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = 3000,
    options?: ToastOptions
  ) => {
    const id = Math.random().toString(36).slice(2, 9);
    const position = options?.position ?? 'top-right';

    setToasts((prev) => [...prev, { id, message, type, duration, position }]);
  }, []);

  const topRightToasts = toasts.filter((toast) => toast.position === 'top-right');
  const bottomCenterToasts = toasts.filter((toast) => toast.position === 'bottom-center');

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <>
          <ToastViewport
            toasts={topRightToasts}
            position="top-right"
            onClose={removeToast}
          />
          <ToastViewport
            toasts={bottomCenterToasts}
            position="bottom-center"
            onClose={removeToast}
          />
        </>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  position,
  onClose,
}: {
  toasts: Toast[];
  position: ToastPosition;
  onClose: (id: string) => void;
}) {
  return (
    <div className={`pointer-events-none fixed z-[9999] flex max-w-[calc(100vw-2rem)] flex-col gap-3 ${positionClassMap[position]}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { tx } = useTranslation();
  const config = toastConfig[toast.type];

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timeout = window.setTimeout(onClose, toast.duration);
    return () => window.clearTimeout(timeout);
  }, [toast.duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`pointer-events-auto w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${config.cardClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4 text-white">
        <div className="mt-0.5 shrink-0">{config.icon}</div>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${config.accentClass}`}>{config.title}</div>
          <p className="mt-1 text-sm text-white/90">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-white/50 transition hover:bg-white dark:bg-gray-800/5 hover:text-white"
          aria-label={tx('toast.close', undefined, 'Close notification')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
