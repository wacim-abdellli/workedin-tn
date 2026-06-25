export function WorkspaceSkeleton() {
    return (
        <div className="animate-pulse space-y-0">
            {/* header */}
            <div className="border-b border-white/[0.06] bg-[var(--color-bg-base)] px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[10px] bg-white/5" />
                    <div className="space-y-1.5">
                        <div className="h-4 w-40 rounded-full bg-white/5" />
                        <div className="h-3 w-24 rounded-full bg-white/[0.03]" />
                    </div>
                    <div className="ms-auto h-6 w-20 rounded-full bg-white/5" />
                </div>
            </div>
            {/* tabs */}
            <div className="flex h-10 items-end gap-6 border-b border-white/[0.06] bg-[var(--color-bg-base)] px-5">
                {['Overview', 'Files', 'Milestones', 'Activity'].map(t => (
                    <div key={t} className="h-3 w-14 rounded-full bg-white/5" />
                ))}
            </div>
            {/* body */}
            <div className="space-y-3 p-5">
                <div className="h-20 w-full rounded-[10px] bg-white/5" />
                <div className="grid grid-cols-3 gap-2">
                    <div className="h-24 rounded-[10px] bg-white/5" />
                    <div className="h-24 rounded-[10px] bg-white/5" />
                    <div className="h-24 rounded-[10px] bg-white/5" />
                </div>
                <div className="h-32 w-full rounded-[10px] bg-white/5" />
            </div>
        </div>
    );
}
