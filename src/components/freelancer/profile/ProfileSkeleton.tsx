import { Skeleton } from '@/components/common/SkeletonCard';

export default function ProfileSkeleton() {
    return (
        <div className="min-h-screen pb-20 md:pb-0" style={{ background: 'var(--page-bg)' }}>
            {/* Header Skeleton */}
            <div
                className="border-b pb-8"
                style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                }}
            >
                <div
                    className="h-48 md:h-64 shimmer bg-[length:200%_100%]"
                    style={{
                        backgroundImage:
                            'linear-gradient(90deg, var(--dash-raised), var(--dash-card-hover), var(--dash-raised))',
                    }}
                />
                <div className="container-custom relative">
                    <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 md:-mt-20 mb-6">
                        <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-[var(--page-bg)]" />
                        <div className="flex-1 pt-20 md:pt-24 space-y-4 w-full">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="flex gap-3">
                                    <Skeleton className="h-10 w-24 rounded-xl" />
                                    <Skeleton className="h-10 w-32 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        <div className="card p-6">
                            <Skeleton className="h-6 w-24 mb-4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                        {/* Skills */}
                        <div className="card p-6">
                            <Skeleton className="h-6 w-24 mb-4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20 rounded-lg" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                                <Skeleton className="h-8 w-16 rounded-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card p-6 space-y-6">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
