import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { useTranslation } from "../../i18n";

interface FileUploadProps {
    onDrop: (files: File[]) => void;
    files: File[];
    onRemove: (index: number) => void;
    maxFiles?: number;
    maxSize?: number; // in bytes
    accept?: Record<string, string[]>;
    error?: string;
    label?: string;
    hint?: string;
}

export default function FileUpload({
    onDrop,
    files,
    onRemove,
    maxFiles = 5,
    maxSize = 5 * 1024 * 1024, // 5MB
    accept = {
        'image/*': [],
        'application/pdf': [],
        'application/msword': [],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
    },
    error,
    label,
    hint
}: FileUploadProps) {
    const { tx } = useTranslation();

    const handleDrop = useCallback((acceptedFiles: File[]) => {
        if (files.length + acceptedFiles.length > maxFiles) {
            // In a real app, show toast or error
            return;
        }
        onDrop(acceptedFiles);
    }, [files, maxFiles, onDrop]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop: handleDrop,
        maxFiles,
        maxSize,
        accept
    });

    return (
        <div className="space-y-4">
            {label && (
                <label className="block text-sm font-medium text-muted-foreground">
                    {label}
                </label>
            )}

            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-border hover:bg-surface'}
                    ${isDragReject || error ? 'border-red-500 bg-red-50' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className={`p-3 rounded-full ${isDragActive ? 'bg-primary-100 text-primary-600' : 'bg-muted text-muted'}`}>
                        <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium text-foreground dark:text-white">
                            {isDragActive ? 'افلت الملفات هنا' : 'اضغط للرفع أو اسحب الملفات هنا'}
                        </p>
                        <p className="text-sm text-muted">
                            {hint || 'PDF, DOCX, JPG, PNG (حد أقصى 5 ميجابايت)'}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {files.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-surface rounded-lg text-muted">
                                    <File className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {(file.size / 1024 / 1024).toFixed(2)} {tx('ui.mb')}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(index);
                                }}
                                className="p-1 hover:bg-red-50 text-muted hover:text-red-500 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
