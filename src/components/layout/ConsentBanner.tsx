'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { SITE_NAME } from '@/lib/constants';

/**
 * [REQ-UI-006-02] Privacy Consent Banner
 * GDPR-compliant cookie consent banner.
 */
export function ConsentBanner() {
  const t = useTranslations('Consent');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem('cookie-consent');
    if (!consented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#C5A059] bg-[#F9F9F7] p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md sm:rounded-2xl sm:border sm:shadow-2xl">
      <h3 className="mb-2 text-lg font-bold text-[#1A1A1A]">{t('title')}</h3>
      <p className="mb-6 text-sm leading-relaxed text-[#44403C]">
        {t('message', { siteName: SITE_NAME })}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleAccept}
          className="flex-1 rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#333333] active:scale-[0.98]"
        >
          {t('accept')}
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-1 rounded-lg border border-[#D6D3D1] bg-white px-6 py-3 text-sm font-bold text-[#555555] transition hover:bg-[#F5F5F4] active:scale-[0.98]"
        >
          {t('reject')}
        </button>
      </div>
    </div>
  );
}
