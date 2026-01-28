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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-dark-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in transition-all duration-300" />

            {/* Modal Content */}
            <div
                className={`
          relative z-10
          w-full ${sizes[size]} 
          bg-white dark:bg-dark-900 
          rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20
          border border-white/20 dark:border-white/10
          animate-modal-pop overflow-hidden
          flex flex-col 
          max-h-[85vh] sm:max-h-[calc(100vh-8rem)]
        `}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-dark-700/50 bg-white/80 dark:bg-dark-900/80 backdrop-blur sticky top-0 z-20">
                        {title && (
                            <h2 id="modal-title" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-dark-900 to-dark-700 dark:from-white dark:to-gray-300">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="group p-2 -m-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
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
