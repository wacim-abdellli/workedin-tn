import { useRef, useCallback } from 'react';

export function useDebouncedCallback<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    delay: number
) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback((...args: TArgs) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}
