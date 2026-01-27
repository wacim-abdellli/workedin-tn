import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    showCloseButton?: boolean;
}

function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
            // Restore overflow cleanup just in case
            if (!document.querySelector('[role="dialog"]')) {
                document.body.style.overflow = 'unset';
            }
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    const sizes = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        'full': 'sm:max-w-[calc(100vw-4rem)]',
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-dark-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
        >
            <div
                className={`
          w-full ${sizes[size]} 
          bg-white dark:bg-dark-900 
          rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/20
          border-x border-t sm:border border-dark-100 dark:border-dark-700
          animate-scale-in overflow-hidden
          flex flex-col 
          fixed bottom-0 sm:relative sm:bottom-auto
          h-[90vh] sm:h-auto sm:max-h-[calc(100vh-4rem)]
          w-full sm:w-auto
        `}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-700 bg-white/50 dark:bg-dark-900/50 backdrop-blur sticky top-0 z-10">
                        {title && (
                            <h2 id="modal-title" className="text-xl font-bold text-dark-900 dark:text-white">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 -m-2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
