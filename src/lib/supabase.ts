 import { createClient } from '@supabase/supabase-js';
import { getUploadPolicy, sanitizeStoragePath, validateUploadSelection } from './uploadPolicy.js';

// Safe environment variable retrieval for Vite and Node/Vercel
const getEnvVar = (key: string): string | undefined => {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    try {
        const metaEnv = (import.meta as any).env;
        if (metaEnv && metaEnv[key]) {
            return metaEnv[key];
        }
    } catch {
        // Ignored
    }
    return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://your-project.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'your-anon-key';

// Anon-only client for public queries (jobs, freelancers) — isolated from user session churn.
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-anon',
    },
});

// Purge stale session synchronously before client reads localStorage
if (typeof window !== 'undefined') {
    try {
        const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
        sbKeys.forEach(k => {
            try {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const expiresAt = parsed?.expires_at;
                    if (expiresAt && Date.now() / 1000 > expiresAt) {
                        localStorage.removeItem(k);
                    }
                }
            } catch {
                // Ignore malformed localStorage records while cleaning stale sessions.
            }
        });
    } catch {
        // Ignore localStorage access failures in restricted environments.
    }
}

// Create Supabase client with minimal config to avoid hangs
// Supabase handles token storage securely via httpOnly cookies when appropriate
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
        headers: {
            'x-client-info': 'WorkedIn-tn',
        },
    },
    // Configure Realtime to prevent 5-second polling fallback
    // Ensures instant message deletion sync and real-time updates
    realtime: {
        headers: {
            'x-client-info': 'WorkedIn-tn',
        },
        // Keep WebSocket connection alive with 30-second heartbeat
        heartbeatIntervalMs: 30000,
    },
});

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default: 15000)
 * @returns The promise result or throws if timeout exceeded
 */
export async function withTimeout<T>(
    promise: PromiseLike<T>,
    timeoutMs: number = 15000,
    operationName: string = 'Operation'
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}

export function isMissingStorageBucketError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorRecord = error as Record<string, unknown>;
    const message = typeof errorRecord.message === 'string' ? errorRecord.message.toLowerCase() : '';
    const statusCode =
        typeof errorRecord.statusCode === 'number'
            ? errorRecord.statusCode
            : typeof errorRecord.status === 'number'
                ? errorRecord.status
                : undefined;

    return statusCode === 404 || message.includes('bucket not found');
}

export function isStoragePermissionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorRecord = error as Record<string, unknown>;
    const message = typeof errorRecord.message === 'string' ? errorRecord.message.toLowerCase() : '';
    const code = typeof errorRecord.code === 'string' ? errorRecord.code : '';
    const statusCode =
        typeof errorRecord.statusCode === 'number'
            ? errorRecord.statusCode
            : typeof errorRecord.status === 'number'
                ? errorRecord.status
                : undefined;

    return code === '42501' || statusCode === 400 || statusCode === 403 || message.includes('row-level security') || message.includes('not authorized');
}

export function getStorageConfigErrorMessage(bucket: string): string {
    return `Storage bucket "${bucket}" is not configured yet.`;
}


// Helper function to get the current user
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

// Helper function to get freelancer profile
export const getFreelancerProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('freelancer_profiles')
        .select(`
      *,
      profiles (*)
    `)
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

// Helper to upload file to storage
export interface UploadedStorageFile {
    path: string;
    publicUrl: string | null;
    bucket: string;
    mimeType: string;
    size: number;
}

export const uploadFileWithMetadata = async (
    bucket: string,
    path: string,
    file: File
): Promise<UploadedStorageFile> => {
    const validation = validateUploadSelection({
        bucket,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
    });

    if (!validation.ok) {
        throw new Error(validation.reason);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('You must be logged in to upload files.');
    }

    const userId = typeof session.user?.id === 'string' ? session.user.id : null;

    // Calculate timeout based on file size
    // Base time: 5 seconds + 5ms per KB for mobile 3G compatibility (100MB = 500s)
    // Minimum 15s for small files, maximum 600s (10 minutes) for large files
    const fileSizeKB = file.size / 1024;
    const calculatedTimeout = Math.min(Math.max(5000 + (fileSizeKB * 5), 15000), 600000);

    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('path', path);
    formData.append('file', file, file.name);

    try {
        const response = await withTimeout(
            fetch(`${supabaseUrl}/functions/v1/secure-upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: supabaseAnonKey,
                    'x-client-info': 'WorkedIn-tn',
                },
                body: formData,
            }),
            calculatedTimeout,
            `Upload ${bucket}/${path}`
        );

        const payload = await response.json().catch(() => ({})) as Partial<UploadedStorageFile> & { error?: string };

        if (!response.ok) {
            const uploadError = new Error(payload.error || 'Upload failed');
            (uploadError as Error & { status?: number; statusCode?: number }).status = response.status;
            (uploadError as Error & { status?: number; statusCode?: number }).statusCode = response.status;
            throw uploadError;
        }

        return {
            path: payload.path || path,
            publicUrl: payload.publicUrl || null,
            bucket: payload.bucket || bucket,
            mimeType: payload.mimeType || file.type,
            size: payload.size || file.size,
        };
    } catch (error) {
        if (!shouldFallbackToDirectAvatarUpload(bucket, error)) {
            throw error;
        }

        return uploadFileDirectly(bucket, path, file, userId);
    }
};

export const uploadFile = async (
    bucket: string,
    path: string,
    file: File
): Promise<string> => {
    const uploaded = await uploadFileWithMetadata(bucket, path, file);
    return uploaded.publicUrl || uploaded.path;
};

function shouldFallbackToDirectAvatarUpload(bucket: string, _error: unknown): boolean {
    const fallbackBuckets = [
        'avatars',
        'identity-documents',
        'identity_documents',
        'verification-documents',
        'attachments',
        'contract-files',
        'message_attachments',
    ];
    return fallbackBuckets.includes(bucket);
}

async function uploadFileDirectly(
    bucket: string,
    path: string,
    file: File,
    userId: string | null
): Promise<UploadedStorageFile> {
    const policy = getUploadPolicy(bucket);
    const desiredPath = userId
        ? sanitizeStoragePath({
            bucket,
            userId,
            desiredPath: path,
            fileName: file.name,
        })
        : { ok: true as const, path };

    const resolvedPath = desiredPath.ok && desiredPath.path ? desiredPath.path : path;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(resolvedPath, file, {
            upsert: policy?.upsert ?? true,
            contentType: file.type || 'application/octet-stream',
        });

    if (error) {
        throw error;
    }

    const publicUrl = policy?.publicUrl
        ? supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl
        : null;

    return {
        path: data.path,
        publicUrl,
        bucket,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
    };
}


