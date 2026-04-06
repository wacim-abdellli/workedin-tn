import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

const toastConfig: Record<ToastType, { icon: React.ReactNode; title: string; bgClass: string; textClass: string; iconClass: string }> = {
  success: {
    icon: <CheckCircle className="h-5 w-5" />,
    title: 'Success',
    bgClass: 'bg-[var(--green-50)] dark:bg-[var(--green-900)]/20 border-[var(--green-200)] dark:border-[var(--green-800)]',
    textClass: 'text-[var(--green-800)] dark:text-[var(--green-200)]',
    iconClass: 'text-[var(--green-600)] dark:text-[var(--green-400)]',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    title: 'Error',
    bgClass: 'bg-[var(--red-50)] dark:bg-[var(--red-900)]/20 border-[var(--red-200)] dark:border-[var(--red-800)]',
    textClass: 'text-[var(--red-800)] dark:text-[var(--red-200)]',
    iconClass: 'text-[var(--red-600)] dark:text-[var(--red-400)]',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: 'Warning',
    bgClass: 'bg-[var(--amber-50)] dark:bg-[var(--amber-900)]/20 border-[var(--amber-200)] dark:border-[var(--amber-800)]',
    textClass: 'text-[var(--amber-800)] dark:text-[var(--amber-200)]',
    iconClass: 'text-[var(--amber-600)] dark:text-[var(--amber-400)]',
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    title: 'Info',
    bgClass: 'bg-[var(--blue-50)] dark:bg-[var(--blue-900)]/20 border-[var(--blue-200)] dark:border-[var(--blue-800)]',
    textClass: 'text-[var(--blue-800)] dark:text-[var(--blue-200)]',
    iconClass: 'text-[var(--blue-600)] dark:text-[var(--blue-400)]',
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
    const position = options?.position ?? 'top-right';

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
      transition={{ 
        duration: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--animation-toast-duration') || '250') / 1000 
      }}
      className={`
        pointer-events-auto 
        w-[min(420px,calc(100vw-2rem))] 
        overflow-hidden 
        rounded-[var(--radius-lg)]
        border-2
        shadow-[var(--shadow-elevation-3)]
        backdrop-blur-sm
        ${config.bgClass}
      `}
      role="status"
      aria-live="polite"
    >
      <div className={`flex items-start gap-3 p-4 ${config.textClass}`}>
        <div className={`mt-0.5 shrink-0 ${config.iconClass}`}>{config.icon}</div>
        <div className="min-w-0 flex-1">
          <div className={`text-[var(--font-fontSize-sm)] font-[var(--font-fontWeight-semibold)] ${config.iconClass}`}>
            {config.title}
          </div>
          <p className="mt-1 text-[var(--font-fontSize-sm)]">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className={`
            rounded-[var(--radius-sm)] 
            p-1 
            transition-colors
            duration-[var(--animation-hover-duration)]
            hover:bg-black/10 
            dark:hover:bg-white/10
          `}
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
