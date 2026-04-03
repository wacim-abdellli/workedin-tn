import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'bottom-center';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastOptions {
  position?: ToastPosition;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: React.ReactNode; title: string; colorClass: string; bgClass: string }> = {
  success: {
    icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    title: 'Success',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-50 dark:bg-green-500/10',
  },
  error: {
    icon: <AlertCircle className="h-6 w-6 text-red-500" />,
    title: 'Error',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-50 dark:bg-red-500/10',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    title: 'Warning',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50 dark:bg-amber-500/10',
  },
  info: {
    icon: <Info className="h-6 w-6 text-primary-500" />,
    title: 'Info',
    colorClass: 'text-primary-500',
    bgClass: 'bg-primary-50 dark:bg-primary-500/10',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', _duration?: number, _options?: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <AnimatePresence>
          {toasts.length > 0 && (
            <ModalToast
              key={toasts[0].id}
              toast={toasts[0]}
              onClose={() => removeToast(toasts[0].id)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ModalToast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = toastConfig[toast.type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
      >
        <div className={`flex items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800 ${config.bgClass}`}>
          {config.icon}
          <h3 className={`text-lg font-semibold ${config.colorClass}`}>
            {config.title}
          </h3>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">
            {toast.message}
          </p>
        </div>
        
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400"
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
