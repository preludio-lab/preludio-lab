import { getTranslations } from 'next-intl/server';
import { SITE_NAME } from '@/lib/constants';

export const Footer = async () => {
    const t = await getTranslations('Footer');

    return (
        <footer className="border-t border-gray-200 bg-white py-12">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-gray-500">
                    {t.rich('copyright', { year: new Date().getFullYear() })}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                    {t('tagline')}
                </p>
            </div>
        </footer>
    );
};
