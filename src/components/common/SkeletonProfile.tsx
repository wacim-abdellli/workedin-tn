import { Skeleton } from './SkeletonCard';

export default function SkeletonProfile() {
    return (
        <div className="bg-card dark:bg-dark-800 rounded-2xl overflow-hidden shadow-sm border border-border dark:border-dark-700">
            <Skeleton className="h-32 w-full" /> {/* Cover */}
            <div className="px-6 pb-6">
                <div className="relative -mt-10 mb-4 flex justify-between items-end">
                    <Skeleton className="h-20 w-20 rounded-2xl border-4 border-white dark:border-dark-800" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="flex gap-2 pt-2">
                        <Skeleton className="h-6 w-16 rounded-lg" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
