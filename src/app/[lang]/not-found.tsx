import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h1 className="text-8xl font-serif text-accent mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">{t('notFound')}</h2>
      <p className="text-neutral-500 mb-8 max-w-md">{t('notFoundDesc')}</p>
      <Link
        href="/"
        className="px-6 py-3 bg-accent text-primary font-medium rounded-full hover:opacity-90 transition-opacity"
      >
        {t('backToHome')}
      </Link>
    </div>
  );
}
