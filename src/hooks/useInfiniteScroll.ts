import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export function useInfiniteScroll(callback: () => void, hasMore: boolean) {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    useEffect(() => {
        if (inView && hasMore) {
            callback();
        }
    }, [inView, hasMore, callback]);

    return ref;
}
