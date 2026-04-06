import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "shimmer rounded-lg bg-gradient-to-r from-[var(--card-bg)] via-[var(--dash-card-hover)] to-[var(--card-bg)] bg-[length:200%_100%]",
                className
            )}
        />
    );
}

export default function SkeletonCard() {
    return (
        <div
            className="premium-panel overflow-hidden rounded-[28px] border p-6 shadow-sm"
            style={{ borderColor: 'var(--color-border-default)' }}
        >
            <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="flex gap-2 mb-6">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
            </div>
            <div
                className="flex justify-between items-center mt-auto pt-4 border-t"
                style={{ borderColor: 'var(--color-border-default)' }}
            >
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
            </div>
        </div>
    );
}
