// Replace next-intl Link with next/link for predictable soft navigation
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SITE_NAME } from '@/lib/constants';
import { SearchBox } from '@/components/search/SearchBox';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

interface HeaderProps {
    lang?: string;
}

export const Header = async ({ lang }: HeaderProps) => {
    const t = await getTranslations('Navigation');
    const homeHref = `/${lang}`;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:grid md:grid-cols-[auto_1fr_auto] md:gap-4">
                <Link href={homeHref} className="flex items-center gap-2 justify-self-start">
                    <span className="text-xl font-bold tracking-tight text-gray-900">{SITE_NAME}</span>
                </Link>

                <div className="hidden md:block w-full max-w-2xl px-8">
                    <SearchBox />
                </div>
                {/* モバイル検索 - 小画面でのみ表示 */}
                <div className="flex-1 px-4 md:hidden">
                    <SearchBox />
                </div>

                <nav className="hidden md:flex w-[400px] gap-6 items-center justify-end justify-self-end whitespace-nowrap">
                    <Link href={`/${lang}/works`} className="text-sm font-medium text-gray-700 hover:text-black whitespace-nowrap">
                        {t('works')}
                    </Link>
                    <Link href={`/${lang}/composers`} className="text-sm font-medium text-gray-700 hover:text-black whitespace-nowrap">
                        {t('composers')}
                    </Link>
                    <Link href={`/${lang}/about`} className="text-sm font-medium text-gray-700 hover:text-black whitespace-nowrap">
                        {t('about')}
                    </Link>
                    <div className="border-l pl-6 border-gray-200">
                        <LanguageSwitcher />
                    </div>
                </nav>
            </div>
        </header>
    );
};
