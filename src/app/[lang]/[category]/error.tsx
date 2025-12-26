'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { handleClientError } from '@/lib/client-error';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('CategoryIndex');

    useEffect(() => {
        handleClientError(error, undefined, 'CategoryIndexPage:Error');
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
            <h2 className="text-2xl font-bold mb-4 text-neutral-800">
                {t('error.title') || 'Something went wrong!'}
            </h2>
            <p className="text-neutral-600 mb-8 max-w-md">
                {t('error.description') || 'An unexpected error occurred while loading the content.'}
            </p>
            <button
                onClick={reset}
                className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-medium shadow-md"
            >
                {t('error.retry') || 'Try again'}
            </button>
        </div>
    );
}
