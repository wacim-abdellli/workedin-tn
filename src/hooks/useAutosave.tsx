import { logger } from '@/lib/logger';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDebouncedCallback } from './useDebouncedCallback';

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
    const latestDataRef = useRef(data);

    useEffect(() => {
        latestDataRef.current = data;
    }, [data]);

    const saveToStorage = useCallback((dataToSave: T) => {
        try {
            setStatus('saving');
            localStorage.setItem(storageKey, JSON.stringify({
                data: dataToSave,
                timestamp: new Date().toISOString()
            }));

            setTimeout(() => {
                setStatus('saved');
                setLastSaved(new Date());
                onSave?.(dataToSave);
                // Stay as 'saved' — no reset to idle so the chip stays stable
            }, 400);

        } catch (error) {
            logger.error('Autosave failed:', error);
            setStatus('error');
        }
    }, [storageKey, onSave]);

    const debouncedSave = useDebouncedCallback(saveToStorage, 1000);

    // Save on data change (debounced) — this is the only trigger needed
    useEffect(() => {
        if (initialMount.current) {
            initialMount.current = false;
            return;
        }

        if (data && typeof data === 'object' && Object.keys(data as Record<string, unknown>).length > 0) {
            debouncedSave(data);
        }
    }, [data, debouncedSave]);

    useEffect(() => {
        if (interval <= 0) return;

        const timer = setInterval(() => {
            const currentData = latestDataRef.current;
            if (currentData && typeof currentData === 'object' && Object.keys(currentData as Record<string, unknown>).length > 0) {
                saveToStorage(currentData);
            }
        }, interval);

        return () => {
            clearInterval(timer);
        };
    }, [interval, saveToStorage]);

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
