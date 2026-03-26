import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/i18n';

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
    const dialogRef = useRef<HTMLDivElement>(null);
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);
    const { t } = useTranslation();
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return;

        lastFocusedElementRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        const getFocusableElements = () => {
            if (!dialogRef.current) return [] as HTMLElement[];
            return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ));
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) {
                e.preventDefault();
                dialogRef.current?.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (e.shiftKey && activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            const [firstFocusable] = getFocusableElements();
            (firstFocusable || dialogRef.current)?.focus();
        });

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
            if (!document.querySelector('[role="dialog"]')) {
                document.body.style.overflow = 'unset';
            }
            lastFocusedElementRef.current?.focus();
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
            className="modal-backdrop items-end sm:items-center p-0 sm:p-4"
        >
            <div
                ref={dialogRef}
                className={`
          modal-surface ${sizes[size]}
          flex flex-col
          elevation-modal
          max-h-[85vh] sm:max-h-[calc(100vh-8rem)]
        `}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
            >
                {(title || showCloseButton) && (
                    <div className="modal-header sticky top-0 z-20">
                        {title && (
                            <h2 id={titleId} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-dark-900 to-dark-700 dark:from-white dark:to-gray-300">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="modal-close-btn group"
                                aria-label={t.common?.close || 'Close modal'}
                            >
                                <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
