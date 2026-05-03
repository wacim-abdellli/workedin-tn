import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/i18n';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
}

/**
 * Modal component with design system tokens.
 * Supports multiple sizes, dismissal patterns (close button, ESC key, backdrop click),
 * optional footer slot, smooth exit animation, and accessibility features.
 */
function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
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
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const onCloseRef = useRef(onClose);
    const closeOnEscapeRef = useRef(closeOnEscape);

    useEffect(() => {
        onCloseRef.current = onClose;
        closeOnEscapeRef.current = closeOnEscape;
    }, [onClose, closeOnEscape]);

    // Handle mount/unmount with animation
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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
            if (e.key === 'Escape' && closeOnEscapeRef.current) {
                onCloseRef.current();
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
            lastFocusedElementRef.current?.focus();
        };
    }, [isOpen]);

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

    if (!mounted) return null;

    return createPortal(
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200"
            style={{
                background: 'var(--color-background-overlay)',
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            <div
                ref={dialogRef}
                className={`${sizes[size]} w-full flex flex-col rounded-2xl max-h-[85vh] sm:max-h-[calc(100vh-8rem)] overflow-hidden transition-all duration-200`}
                style={{
                    background: 'var(--color-background-elevated)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--color-border-subtle)',
                    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
                    opacity: visible ? 1 : 0,
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
            >
                {(title || showCloseButton) && (
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-20"
                        style={{
                            borderColor: 'var(--color-border-subtle)',
                            background: 'var(--color-background-elevated)',
                        }}
                    >
                        {title && (
                            <h2
                                id={titleId}
                                className="text-lg font-semibold"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl transition-all duration-150 hover:rotate-90"
                                style={{
                                    color: 'var(--color-text-secondary)',
                                    background: 'transparent',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--color-background-muted)';
                                    e.currentTarget.style.color = 'var(--color-text-primary)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                                }}
                                aria-label={t.common?.close || 'Close modal'}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>
                {footer && (
                    <div
                        className="px-6 py-4 border-t"
                        style={{
                            borderColor: 'var(--color-border-subtle)',
                            background: 'var(--color-background-elevated)',
                        }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export default Modal;
