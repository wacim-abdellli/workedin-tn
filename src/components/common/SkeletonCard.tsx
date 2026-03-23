import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#242235] dark:via-[#2a2840] dark:to-[#242235] bg-[length:200%_100%] animate-shimmer",
                className
            )}
        />
    );
}

export default function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-[#1a1825] p-6 rounded-2xl shadow-sm border border-[#e8e6f0] dark:border-[#2a2840] overflow-hidden">
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
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-[#e8e6f0] dark:border-[#2a2840]">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
            </div>
        </div>
    );
}
