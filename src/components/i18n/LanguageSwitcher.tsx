'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/shared/i18n/navigation';
import { AppLocale, supportedLocales, localeLabels } from '@/domain/i18n/locale';
import { useTransition, useState, useEffect, useRef } from 'react';
import { handleClientError } from '@/lib/client-error';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウンの外側をクリックした時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      try {
        router.replace(pathname, { locale: nextLocale });
        setIsOpen(false);
      } catch (error) {
        handleClientError(error, '言語の切り替えに失敗しました');
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
                    flex items-center gap-2 rounded-full border bg-paper px-4 py-2 text-sm font-medium transition-all whitespace-nowrap
                    ${
                      isOpen
                        ? 'border-accent text-accent ring-1 ring-accent'
                        : 'border-neutral-200 text-primary hover:border-neutral-300 hover:bg-neutral-50'
                    }
                `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={isPending}
      >
        <span className="uppercase tracking-wide whitespace-nowrap">{localeLabels[locale]}</span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 min-w-max origin-top-right rounded-xl border border-neutral-100 bg-paper p-1 shadow-lg ring-1 ring-black/5">
          <ul role="listbox">
            {supportedLocales.map((cur) => (
              <li key={cur}>
                <button
                  type="button"
                  onClick={() => handleLanguageChange(cur)}
                  className={`
                                        flex w-full items-center justify-between rounded-lg px-4 py-2 text-left text-sm transition-colors
                                        ${
                                          locale === cur
                                            ? 'bg-neutral-100 text-accent font-semibold'
                                            : 'text-primary hover:bg-neutral-50'
                                        }
                                    `}
                  role="option"
                  aria-selected={locale === cur}
                >
                  <span>{localeLabels[cur]}</span>
                  {locale === cur && (
                    <svg
                      className="ml-3 h-4 w-4 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
