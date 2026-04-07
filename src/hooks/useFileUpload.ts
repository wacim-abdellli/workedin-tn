import { useState, useCallback, useRef } from 'react';
import { uploadFileWithMetadata } from '../lib/supabase';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
}

interface UseFileUploadOptions {
    bucket?: string;
    maxSizeMB?: number;
    allowedTypes?: string[];
    onProgress?: (progress: number) => void;
}

interface UseFileUploadReturn {
    upload: (file: File, path: string) => Promise<UploadedFile>;
    uploadMultiple: (files: File[], basePath: string) => Promise<UploadedFile[]>;
    isUploading: boolean;
    progress: number;
    error: Error | null;
    reset: () => void;
}

// Default allowed file types
const DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];

export function useFileUpload({
    bucket = 'contract-files',
    maxSizeMB = 10,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onProgress,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Validate file before upload
    const validateFile = useCallback(
        (file: File) => {
            const maxSizeBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                throw new Error(`الملف كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`);
            }
            if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
                throw new Error('نوع الملف غير مدعوم');
            }
            return true;
        },
        [maxSizeMB, allowedTypes]
    );

    // Upload single file
    // `path` is treated as a base directory (e.g. `${user.id}/${contractId}`).
    // The hook appends `/${timestamp}-${sanitizedName}` to form the final path.
    // For buckets with requireUserPrefix: true, path MUST start with the user's UUID.
    const upload = useCallback(
        async (file: File, path: string): Promise<UploadedFile> => {
            validateFile(file);

            setIsUploading(true);
            setError(null);
            setProgress(0);

            abortControllerRef.current = new AbortController();

            try {
                // Build the full desired storage path.
                // `path` is the caller-supplied folder; we append timestamp + sanitized
                // filename exactly once, so there is no double-nesting.
                const timestamp = Date.now();
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const desiredPath = `${path}/${timestamp}-${sanitizedName}`;

                // Route through the secure-upload Edge Function.
                // This enforces: JWT auth, rate limit, magic-byte validation,
                // path sanitization, and userId-prefix isolation — all server-side.
                const result = await uploadFileWithMetadata(bucket, desiredPath, file);

                setProgress(100);
                onProgress?.(100);

                const uploadedFile: UploadedFile = {
                    id: result.path,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    // publicUrl is non-null for public buckets, null for private ones.
                    // Fall back to storage path so callers always get a non-empty string.
                    url: result.publicUrl ?? result.path,
                };

                return uploadedFile;
            } catch (err) {
                const error = err as Error;
                setError(error);
                throw error;
            } finally {
                setIsUploading(false);
                abortControllerRef.current = null;
            }
        },
        [bucket, validateFile, onProgress]
    );

    // Upload multiple files
    const uploadMultiple = useCallback(
        async (files: File[], basePath: string): Promise<UploadedFile[]> => {
            const results: UploadedFile[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileProgress = ((i + 1) / totalFiles) * 100;
                setProgress(fileProgress);
                onProgress?.(fileProgress);

                const uploaded = await upload(file, basePath);
                results.push(uploaded);
            }

            return results;
        },
        [upload, onProgress]
    );

    // Reset state
    const reset = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsUploading(false);
        setProgress(0);
        setError(null);
    }, []);

    return {
        upload,
        uploadMultiple,
        isUploading,
        progress,
        error,
        reset,
    };
}

// Helper to get file icon based on type
export function getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType === 'text/plain') return '📃';
    return '📎';
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default useFileUpload;
