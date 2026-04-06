import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/i18n';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
}

/**
 * Modal component with design system tokens.
 * Supports multiple sizes, dismissal patterns (close button, ESC key, backdrop click),
 * and accessibility features (focus trap, ARIA attributes).
 * 
 * @component
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Action" size="md">
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 */
function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdropClick = true,
    closeOnEscape = true,
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
            if (e.key === 'Escape' && closeOnEscape) {
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
        if (closeOnBackdropClick && e.target === overlayRef.current) {
            onClose();
        }
    };

    const sizes = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        full: 'sm:max-w-[calc(100vw-4rem)]',
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-background-overlay)] backdrop-blur-sm animate-fade-in"
        >
            <div
                ref={dialogRef}
                className={`
                    ${sizes[size]}
                    w-full
                    flex flex-col
                    bg-[var(--color-background-elevated)]
                    rounded-[var(--radius-xl)]
                    shadow-[var(--shadow-elevation-4)]
                    max-h-[85vh] sm:max-h-[calc(100vh-8rem)]
                    overflow-hidden
                    animate-scale-in
                `}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] sticky top-0 z-20 bg-[var(--color-background-elevated)]">
                        {title && (
                            <h2 
                                id={titleId} 
                                className="text-[var(--font-fontSize-xl)] font-[var(--font-fontWeight-semibold)] text-[var(--color-text-primary)]"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="
                                    p-2 
                                    rounded-[var(--radius-md)]
                                    text-[var(--color-text-secondary)]
                                    hover:text-[var(--color-text-primary)]
                                    hover:bg-[var(--color-background-muted)]
                                    transition-all duration-[var(--animation-hover-duration)]
                                    focus:outline-none 
                                    focus:ring-2 
                                    focus:ring-[var(--color-brand-primary)]/30
                                "
                                aria-label={t.common?.close || 'Close modal'}
                            >
                                <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
