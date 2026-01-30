import React, { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
                newErrors.push(`${file.name} أكبر من ${maxSize}MB`);
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
                newErrors.push(`${file.name} نوع غير مدعوم`);
                return;
            }

            validFiles.push(file);
        });

        const currentFilesCount = value?.length || 0;

        // Check max files
        if (currentFilesCount + validFiles.length > maxFiles) {
            newErrors.push(`الحد الأقصى ${maxFiles} ملفات`);
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
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    isDragging
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                        : "border-gray-300 dark:border-gray-700"
                )}
            >
                <div className="flex justify-center">
                    <Upload className="w-12 h-12 mb-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    اسحب الملفات هنا أو انقر للتصفح
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
                    className="inline-block mt-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    اختر ملفات
                </label>
            </div>

            {/* File list */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
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
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                                aria-label={`حذف ${file.name}`}
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
