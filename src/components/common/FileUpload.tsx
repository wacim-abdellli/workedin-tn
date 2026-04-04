import React, { useState } from 'react';
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
    accept = '.pdf,.doc,.docx,.txt',
    maxSize = 10, // 10MB
    maxFiles = 5,
    label,
    description
}) => {
    const { tx } = useTranslation();
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
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/40"
                        : "border-primary-100 bg-white/70 dark:border-white/10 dark:border-gray-800 dark:bg-white/[0.03]"
                )}
            >
                <div className="flex justify-center">
                    <div className="mb-4 rounded-2xl bg-primary-50 p-4 text-primary-600 dark:bg-white dark:bg-gray-800/[0.06] dark:text-primary-300">
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
                    id="file-upload"
                />
                <label
                    htmlFor="file-upload"
                    className="inline-block mt-4 rounded-xl border border-primary-200 bg-white dark:bg-gray-800 px-4 py-2 font-medium text-primary-700 cursor-pointer hover:bg-primary-50 dark:border-white/10 dark:border-gray-800 dark:bg-[#1a1825] dark:text-primary-300 dark:hover:bg-white dark:bg-gray-800/[0.06] transition-colors"
                >
                    {tx('common.fileUpload.chooseFiles', undefined, 'Choose files')}
                </label>
            </div>

            {/* File list */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-2xl border border-primary-100/70 bg-gray-50 dark:bg-gray-900/80 p-3 dark:border-white/10 dark:border-gray-800 dark:bg-white dark:bg-gray-800/[0.03]"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white truncate max-w-[200px]">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="rounded-lg p-1 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700"
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
