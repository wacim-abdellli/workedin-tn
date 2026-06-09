import { useState, useCallback, useRef } from 'react';
import * as tus from 'tus-js-client';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

// Browser-safe Base64 encoder supporting Unicode characters
function encodeBase64(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}

export function useTusUpload() {
    const [progress, setProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const uploadRef = useRef<tus.Upload | null>(null);

    const pause = useCallback(() => {
        if (uploadRef.current) {
            uploadRef.current.abort();
            setIsUploading(false);
        }
    }, []);

    const resume = useCallback(() => {
        if (uploadRef.current) {
            setIsUploading(true);
            uploadRef.current.start();
        }
    }, []);

    const reset = useCallback(() => {
        uploadRef.current = null;
        setProgress(0);
        setIsUploading(false);
        setError(null);
    }, []);

    const uploadFile = useCallback(
        (file: File, bucketName: string, objectName: string): Promise<string> => {
            return new Promise(async (resolve, reject) => {
                setError(null);
                setIsUploading(true);
                setProgress(0);

                try {
                    // Fetch active Supabase session token dynamically
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    if (!token) {
                        throw new Error('Authentication session not found. Please log in.');
                    }

                    const endpoint = `${SUPABASE_URL}/storage/v1/upload/resumable`;

                    const upload = new tus.Upload(file, {
                        endpoint,
                        retryDelays: [0, 1000, 3000, 5000],
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'x-client-info': 'supabase-js/2.0.0',
                        },
                        metadata: {
                            bucketName: encodeBase64(bucketName),
                            objectName: encodeBase64(objectName),
                            contentType: encodeBase64(file.type || 'application/octet-stream'),
                            cacheControl: encodeBase64('max-age=3600'),
                        },
                        chunkSize: 6 * 1024 * 1024, // 6MB chunk size for reliable transmission
                        onError: (err) => {
                            console.error('[TUS Upload Error]:', err);
                            const finalErr = new Error(err.message || 'Resumable upload failed.');
                            setError(finalErr);
                            setIsUploading(false);
                            reject(finalErr);
                        },
                        onProgress: (bytesUploaded, bytesTotal) => {
                            const pct = Math.round((bytesUploaded / bytesTotal) * 100);
                            setProgress(pct);
                        },
                        onSuccess: () => {
                            setIsUploading(false);
                            setProgress(100);
                            // Supabase storage returns the uploaded object path
                            resolve(objectName);
                        },
                    });

                    uploadRef.current = upload;
                    upload.start();
                } catch (err) {
                    console.error('[TUS Setup Error]:', err);
                    const finalErr = err instanceof Error ? err : new Error(String(err));
                    setError(finalErr);
                    setIsUploading(false);
                    reject(finalErr);
                }
            });
        },
        []
    );

    return {
        uploadFile,
        progress,
        isUploading,
        error,
        pause,
        resume,
        reset,
    };
}
