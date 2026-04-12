import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    imgClassName?: string;
    priority?: boolean;
    fill?: boolean;
}

export default function OptimizedImage({
    src,
    alt,
    className = '',
    imgClassName = '',
    priority = false,
    fill = true, // Default to filling container
    ...props
}: OptimizedImageProps) {
    const normalizedSrc = typeof src === 'string' ? src.trim() : '';
    const hasSource = normalizedSrc.length > 0;

    const [isLoading, setIsLoading] = useState(hasSource);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(!hasSource);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const nextHasSource = typeof src === 'string' && src.trim().length > 0;
        setHasError(!nextHasSource);
        setIsLoading(nextHasSource);
    }, [src]);

    useEffect(() => {
        if (priority || isInView || !hasSource) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '50px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [priority, isInView, hasSource]);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden bg-[#111111] ${className}`}
        >
            {/* Loading Skeleton */}
            {isLoading && !hasError && hasSource && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse z-10" />
            )}

            {/* Error Placeholder */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#101010] text-white/30 z-20">
                    <ImageIcon className="w-7 h-7" />
                </div>
            )}

            {/* Image */}
            {(isInView || priority) && hasSource && !hasError && (
                <img
                    src={normalizedSrc}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                    className={`
                        transition-opacity duration-500 ease-in-out
                        ${isLoading ? 'opacity-0' : 'opacity-100'}
                        ${fill ? 'w-full h-full object-cover' : ''}
                        ${imgClassName}
                    `}
                    {...props}
                />
            )}
        </div>
    );
}
