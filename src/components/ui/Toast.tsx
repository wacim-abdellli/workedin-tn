import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useTranslation } from '../../i18n';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'top-center' | 'bottom-right';

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

const toastConfig: Record<ToastType, { icon: React.ReactNode; titleKey: string; titleFallback: string; bgClass: string; textClass: string; iconClass: string }> = {
  success: {
    icon: <CheckCircle className="h-5 w-5" />,
    titleKey: 'toast.success',
    titleFallback: 'Success',
    bgClass: 'bg-emerald-950/95 border-emerald-500/60',
    textClass: 'text-emerald-100',
    iconClass: 'text-emerald-300',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    titleKey: 'toast.error',
    titleFallback: 'Error',
    bgClass: 'bg-rose-950/95 border-rose-500/70',
    textClass: 'text-rose-100',
    iconClass: 'text-rose-300',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    titleKey: 'toast.warning',
    titleFallback: 'Warning',
    bgClass: 'bg-amber-950/95 border-amber-500/70',
    textClass: 'text-amber-100',
    iconClass: 'text-amber-300',
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    titleKey: 'toast.info',
    titleFallback: 'Info',
    bgClass: 'bg-sky-950/95 border-sky-500/65',
    textClass: 'text-sky-100',
    iconClass: 'text-sky-300',
  },
};

const positionClassMap: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
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
    const position = options?.position ?? 'bottom-right';

    setToasts((prev) => [...prev, { id, message, type, duration, position }]);
  }, []);

  const topRightToasts = toasts.filter((toast) => toast.position === 'top-right');
  const topCenterToasts = toasts.filter((toast) => toast.position === 'top-center');
  const bottomRightToasts = toasts.filter((toast) => toast.position === 'bottom-right');

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
            toasts={topCenterToasts}
            position="top-center"
            onClose={removeToast}
          />
          <ToastViewport
            toasts={bottomRightToasts}
            position="bottom-right"
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
      <AnimatePresence mode="popLayout">
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
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timeout = window.setTimeout(onClose, toast.duration);
    return () => window.clearTimeout(timeout);
  }, [toast.duration, onClose]);

  return (
    <m.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
      transition={{ 
        duration: shouldReduceMotion
          ? 0.14
          : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--animation-toast-duration') || '250') / 1000 
      }}
      className={`
        pointer-events-auto 
        w-[min(380px,calc(100vw-2rem))] 
        overflow-hidden 
        rounded-xl
        border
        shadow-2xl
        backdrop-blur-sm
        ${config.bgClass}
      `}
      role="status"
      aria-live="polite"
      style={{ willChange: 'transform, opacity' }}
    >
      <div className={`flex items-start gap-3 p-3.5 ${config.textClass}`}>
        <div className={`mt-0.5 shrink-0 ${config.iconClass}`}>{config.icon}</div>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${config.iconClass}`}>
            {tx(config.titleKey, undefined, config.titleFallback)}
          </div>
          <p className="mt-1 text-sm leading-5">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className={`
            rounded-[var(--radius-sm)] 
            p-1 
            transition-colors
            duration-[var(--animation-hover-duration)]
            hover:bg-white/10
          `}
          aria-label={tx('toast.close', undefined, 'Close notification')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </m.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
