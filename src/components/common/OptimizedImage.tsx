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
    const [isLoading, setIsLoading] = useState(true);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (priority || isInView) return;

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
    }, [priority, isInView]);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
        >
            {/* Loading Skeleton */}
            {isLoading && !hasError && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse z-10" />
            )}

            {/* Error Placeholder */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 z-20">
                    <ImageIcon className="w-6 h-6" />
                </div>
            )}

            {/* Image */}
            {(isInView || priority) && (
                <img
                    src={src}
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
