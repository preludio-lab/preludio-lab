import Link from 'next/link';
import { ContentSummary } from '@/domain/content/Content';

type Props = {
    prev: ContentSummary | null;
    next: ContentSummary | null;
    lang: string;
};

export const SeriesNavigation: React.FC<Props> = ({ prev, next, lang }) => {
    if (!prev && !next) return null;

    return (
        <nav className="border-t border-neutral-200 mt-12 pt-8">
            <div className="flex justify-between items-stretch gap-4">
                {prev ? (
                    <Link
                        href={`/${lang}/works/${prev.slug}`}
                        className="flex-1 p-4 rounded-xl border border-neutral-200 hover:border-accent hover:bg-neutral-50 transition-all group text-left"
                    >
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1 group-hover:text-accent font-medium">
                            Previous
                        </div>
                        <div className="font-semibold text-primary group-hover:text-accent transition-colors font-serif">
                            {prev.metadata.title}
                        </div>
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}

                {next ? (
                    <Link
                        href={`/${lang}/works/${next.slug}`}
                        className="flex-1 p-4 rounded-xl border border-neutral-200 hover:border-accent hover:bg-neutral-50 transition-all group text-right"
                    >
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1 group-hover:text-accent font-medium">
                            Next
                        </div>
                        <div className="font-semibold text-primary group-hover:text-accent transition-colors font-serif">
                            {next.metadata.title}
                        </div>
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}
            </div>
        </nav>
    );
};
