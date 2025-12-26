export function ContentCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 flex flex-col h-full animate-pulse">
            {/* Image Skeleton */}
            <div className="aspect-video w-full bg-neutral-200"></div>

            {/* Content Skeleton */}
            <div className="p-5 flex flex-col flex-grow space-y-3">
                {/* Meta Tags */}
                <div className="flex gap-2">
                    <div className="h-5 w-16 bg-neutral-200 rounded-full"></div>
                    <div className="h-5 w-20 bg-neutral-200 rounded-full"></div>
                </div>

                {/* Title */}
                <div className="h-7 w-3/4 bg-neutral-200 rounded-md"></div>

                {/* Composer */}
                <div className="h-5 w-1/2 bg-neutral-200 rounded-md"></div>

                <div className="flex-grow"></div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-neutral-100">
                    <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                    <div className="h-4 w-12 bg-neutral-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}
