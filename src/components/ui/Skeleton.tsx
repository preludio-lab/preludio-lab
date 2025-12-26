export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse rounded-md bg-gray-200/50 ${className}`} />
    );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
            ))}
        </div>
    );
}
