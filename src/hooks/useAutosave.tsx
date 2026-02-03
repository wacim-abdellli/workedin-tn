import { logger } from '@/lib/logger';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom debounce implementation to avoid lodash dependency
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

interface UseAutosaveProps<T> {
    data: T;
    storageKey: string;
    onSave?: (data: T) => void;
    interval?: number; // milliseconds
}

export const useAutosave = <T,>({
    data,
    storageKey,
    onSave,
    interval = 30000 // 30 seconds default
}: UseAutosaveProps<T>) => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const initialMount = useRef(true);

    const saveToStorage = useCallback((dataToSave: T) => {
        try {
            setStatus('saving');
            localStorage.setItem(storageKey, JSON.stringify({
                data: dataToSave,
                timestamp: new Date().toISOString()
            }));

            // Simulate a short delay for UX purposes (so "Saving..." is visible)
            setTimeout(() => {
                setStatus('saved');
                setLastSaved(new Date());
                onSave?.(dataToSave);

                // Reset to idle after 2 seconds
                setTimeout(() => setStatus('idle'), 2000);
            }, 500);

        } catch (error) {
            logger.error('Autosave failed:', error);
            setStatus('error');
        }
    }, [storageKey, onSave]);

    const debouncedSave = useDebounce(saveToStorage, 1000);

    // Save on data change (debounced)
    useEffect(() => {
        if (initialMount.current) {
            initialMount.current = false;
            return;
        }

        // Only save if data is not empty/null (basic check)
        if (data && typeof data === 'object' && Object.keys(data as Record<string, unknown>).length > 0) {
            debouncedSave(data);
        }
    }, [data, debouncedSave]);

    // Save on interval
    useEffect(() => {
        const timer = setInterval(() => {
            if (data && typeof data === 'object' && Object.keys(data as Record<string, unknown>).length > 0) {
                saveToStorage(data);
            }
        }, interval);
        return () => clearInterval(timer);
    }, [data, interval, saveToStorage]);

    const loadFromStorage = (): { data: T; timestamp: Date } | null => {
        try {
            const savedItem = localStorage.getItem(storageKey);
            if (!savedItem) return null;

            const parsed = JSON.parse(savedItem);
            // Handle both simple data and wrapped {data, timestamp} format
            if (parsed.timestamp && parsed.data) {
                return {
                    data: parsed.data,
                    timestamp: new Date(parsed.timestamp)
                };
            }
            return {
                data: parsed,
                timestamp: new Date() // Fallback if no timestamp
            };
        } catch {
            return null;
        }
    };

    const clearStorage = () => {
        localStorage.removeItem(storageKey);
        setStatus('idle');
        setLastSaved(null);
    };

    return {
        status,
        lastSaved,
        loadFromStorage,
        clearStorage
    };
};
