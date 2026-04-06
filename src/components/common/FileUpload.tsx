import React, { useId, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';

interface FileUploadProps {
    value: File[];
    onChange: (files: File[]) => void;
    accept?: string;
    maxSize?: number; // in MB
    maxFiles?: number;
    label?: string;
    description?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    value = [],
    onChange,
    accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp',
    maxSize = 10, // 10MB
    maxFiles = 5,
    label,
    description
}) => {
    const { tx } = useTranslation();
    const inputId = useId();
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    };

    const handleFiles = (newFiles: File[]) => {
        setErrors([]);
        const validFiles: File[] = [];
        const newErrors: string[] = [];

        newFiles.forEach(file => {
            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                newErrors.push(tx('common.fileUpload.fileTooLarge', { name: file.name, size: maxSize }, `${file.name} is larger than ${maxSize}MB`));
                return;
            }

            // Check file type
            // Get extension from filename
            const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
            // Handle accept string like ".pdf,.doc"
            const authorizedExtensions = accept.split(',').map(e => e.trim().toLowerCase());

            // Check if extension matches or if accept has specific MIME types (simplified here to extension)
            // Ideally we'd match MIME types too, but for now extension check is aligned with user request
            const isAuthorized = authorizedExtensions.some(ext => fileExt === ext);

            if (accept && !isAuthorized) {
                newErrors.push(tx('common.fileUpload.unsupportedType', { name: file.name }, `${file.name} has an unsupported file type`));
                return;
            }

            validFiles.push(file);
        });

        const currentFilesCount = value?.length || 0;

        // Check max files
        if (currentFilesCount + validFiles.length > maxFiles) {
            newErrors.push(tx('common.fileUpload.maxFilesExceeded', { count: maxFiles }, `Maximum ${maxFiles} files allowed`));
            setErrors(newErrors);
            return;
        }

        setErrors(newErrors);
        // If there are valid files, append them to existing ones
        if (validFiles.length > 0) {
            onChange([...value, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "rounded-[1.6rem] border-2 border-dashed p-8 text-center transition-colors",
                    isDragging
                        ? "border-[color:var(--workspace-primary)] bg-[color:var(--workspace-primary)]/10"
                        : "border-border bg-white/70 dark:border-white/10 dark:border-gray-800 dark:bg-white/[0.03]"
                )}
            >
                <div className="flex justify-center">
                    <div
                        className="mb-4 rounded-2xl p-4"
                        style={{
                            background: 'color-mix(in srgb, var(--workspace-primary) 14%, var(--card-bg))',
                            color: 'var(--workspace-primary-active)',
                        }}
                    >
                        <Upload className="h-8 w-8" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {tx('common.fileUpload.dropzoneHint', undefined, 'Drag files here or click to browse')}
                </p>
                {description && (
                    <p className="text-xs text-gray-500">{description}</p>
                )}
                <input
                    type="file"
                    multiple
                    accept={accept}
                    onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                    className="hidden"
                    id={inputId}
                />
                <label
                    htmlFor={inputId}
                    className="inline-block mt-4 rounded-xl border px-4 py-2 font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--workspace-primary) 28%, transparent)',
                        background: 'color-mix(in srgb, var(--workspace-primary) 12%, var(--card-bg))',
                        color: 'var(--workspace-primary-active)',
                    }}
                    onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        target.style.background = 'color-mix(in srgb, var(--workspace-primary) 20%, var(--card-bg))';
                        target.style.boxShadow = '0 12px 24px -18px rgba(245,158,11,0.35)';
                    }}
                    onMouseLeave={(e) => {
                        const target = e.currentTarget;
                        target.style.background = 'color-mix(in srgb, var(--workspace-primary) 12%, var(--card-bg))';
                        target.style.boxShadow = 'none';
                    }}
                >
                    {tx('common.fileUpload.chooseFiles', undefined, 'Choose files')}
                </label>
            </div>

            {/* File list */}
            {value.length > 0 && (
                <div className="space-y-3">
                    {value.map((file, index) => (
                        <div
                            key={index}
                            className="group flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, var(--border))',
                                background: 'linear-gradient(120deg, color-mix(in srgb, var(--workspace-primary) 8%, var(--surface-bg)), color-mix(in srgb, var(--card-bg) 96%, black))',
                                boxShadow: '0 14px 30px -24px rgba(245,158,11,0.28)',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                                    style={{
                                        background: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--card-bg))',
                                        color: 'var(--workspace-primary)',
                                    }}
                                >
                                    <FileText className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold truncate max-w-[260px]" style={{ color: 'var(--text-primary)' }}>
                                        {file.name}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="rounded-xl p-2 transition-all duration-200 hover:scale-105"
                                style={{
                                    color: 'var(--text-muted)',
                                    background: 'color-mix(in srgb, var(--card-bg) 88%, transparent)',
                                }}
                                onMouseEnter={(e) => {
                                    const target = e.currentTarget;
                                    target.style.color = '#f87171';
                                    target.style.background = 'rgba(248,113,113,0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.currentTarget;
                                    target.style.color = 'var(--text-muted)';
                                    target.style.background = 'color-mix(in srgb, var(--card-bg) 88%, transparent)';
                                }}
                                aria-label={tx('common.fileUpload.removeFileAria', { name: file.name }, `Remove ${file.name}`)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                    {errors.map((error, i) => (
                        <p key={i}>{error}</p>
                    ))}
                </div>
            )}
        </div>
    );
};
