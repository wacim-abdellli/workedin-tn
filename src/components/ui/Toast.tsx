import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: React.ReactNode; accent: string; glow: string }> = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    accent: 'border-l-[3px] border-green-500',
    glow: 'from-green-500',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    accent: 'border-l-[3px] border-red-500',
    glow: 'from-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    accent: 'border-l-[3px] border-amber-500',
    glow: 'from-amber-500',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    accent: 'border-l-[3px] border-blue-500',
    glow: 'from-blue-500',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast = { id, message, type, duration };

    setToasts((prev) => [...prev.slice(-2), toast]);

    if (duration > 0) {
      window.setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed right-4 top-4 z-[110] flex w-[min(100vw-2rem,24rem)] flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const config = toastConfig[toast.type];

              return (
                <motion.button
                  key={toast.id}
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className={`glass-card ${config.accent} relative overflow-hidden rounded-2xl px-4 py-4 text-left shadow-2xl`}
                  initial={{ opacity: 0, x: 32, y: -8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: 32, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${config.glow} to-transparent`}>
                    <motion.div
                      className="h-full bg-white/60 dark:bg-white/25"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0">{config.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1a1825] dark:text-white">{toast.message}</p>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white">
                      <X className="h-4 w-4" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
