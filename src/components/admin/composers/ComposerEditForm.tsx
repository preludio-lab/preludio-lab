'use client';

import React, { useState, useTransition } from 'react';
import { GetComposerDto } from '@/application/composer/dto/get-composer.dto';
import { updateComposerAction } from '@/actions/composer.action';

interface ComposerEditFormProps {
  composer: GetComposerDto;
  onCancel: () => void;
}

const LANGUAGES = ['ja', 'en', 'es', 'de', 'fr', 'it', 'zh'] as const;
type LanguageCode = (typeof LANGUAGES)[number];

export function ComposerEditForm({ composer, onCancel }: ComposerEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Initialize form state
  const [formData, setFormData] = useState({
    slug: composer.slug,
    era: composer.era || '',
    birthDate: composer.birthDate ? composer.birthDate.split('T')[0] : '', // simple YYYY-MM-DD for input type date
    deathDate: composer.deathDate ? composer.deathDate.split('T')[0] : '',
    nationalityCode: composer.nationalityCode || '',
    translations: LANGUAGES.reduce(
      (acc, lang) => {
        acc[lang] = {
          fullName: composer.translations[lang]?.fullName || '',
          displayName: composer.translations[lang]?.displayName || '',
          shortName: composer.translations[lang]?.shortName || '',
          biography: composer.translations[lang]?.biography || '',
        };
        return acc;
      },
      {} as Record<
        LanguageCode,
        { fullName: string; displayName: string; shortName: string; biography: string }
      >,
    ),
  });

  const [activeLang, setActiveLang] = useState<LanguageCode>('ja');

  const handleTranslationChange = (lang: LanguageCode, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          [field]: value,
        },
      },
    }));
  };

  const handleBasicChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    // Prepare data
    const payload = {
      id: composer.id,
      slug: formData.slug,
      era: formData.era || null,
      birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
      deathDate: formData.deathDate ? new Date(formData.deathDate).toISOString() : null,
      nationalityCode: formData.nationalityCode || null,
      translations: Object.fromEntries(
        Object.entries(formData.translations).map(([lang, data]) => [
          lang,
          {
            fullName: data.fullName || '',
            displayName: data.displayName || data.fullName || '',
            shortName: data.shortName || '',
            biography: data.biography || null,
          },
        ]),
      ),
      updatedAt: composer.updatedAt,
    };

    const submitFormData = new FormData();
    submitFormData.set('data', JSON.stringify(payload));

    startTransition(async () => {
      try {
        const response = await updateComposerAction(null, submitFormData);
        if (response.success) {
          window.location.reload(); // Simple refresh to show updated data
        } else {
          setErrorStatus(response.message);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setErrorStatus(err.message || 'An error occurred during save.');
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-admin-card-bg rounded-lg border border-admin-border p-6 space-y-6"
    >
      {errorStatus && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md text-sm">
          {errorStatus}
        </div>
      )}

      {/* Basic Info */}
      <h3 className="text-lg font-medium text-admin-text-primary border-b border-admin-border pb-2">
        共通情報
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            スラグ (URL用)
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => handleBasicChange('slug', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">時代</label>
          <input
            type="text"
            value={formData.era}
            onChange={(e) => handleBasicChange('era', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            生年月日
          </label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleBasicChange('birthDate', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            没年月日
          </label>
          <input
            type="date"
            value={formData.deathDate}
            onChange={(e) => handleBasicChange('deathDate', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            国籍コード (ISO 3166-1 alpha-2)
          </label>
          <input
            type="text"
            maxLength={2}
            value={formData.nationalityCode}
            onChange={(e) => handleBasicChange('nationalityCode', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary uppercase"
          />
        </div>
      </div>

      {/* Multi-language Information */}
      <h3 className="text-lg font-medium text-admin-text-primary border-b border-admin-border pb-2 mt-8">
        多言語情報
      </h3>

      {/* Language Tabs */}
      <div className="flex space-x-2 border-b border-admin-border mb-4 overflow-x-auto pb-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeLang === lang
                ? 'bg-admin-surface text-admin-primary border-t border-x border-admin-border -mb-[9px] pb-[9px] z-10 relative'
                : 'text-admin-text-secondary hover:text-admin-text-primary'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Translation Form for Active Language */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            正式名称 / Full Name
          </label>
          <input
            type="text"
            value={formData.translations[activeLang].fullName}
            onChange={(e) => handleTranslationChange(activeLang, 'fullName', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
            required={activeLang === 'en' || activeLang === 'ja'} // Require at least EN or JA normally, but schema requires all for now in PoC
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            表示名 / Display Name
          </label>
          <input
            type="text"
            value={formData.translations[activeLang].displayName}
            onChange={(e) => handleTranslationChange(activeLang, 'displayName', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            略称 / Short Name
          </label>
          <input
            type="text"
            value={formData.translations[activeLang].shortName}
            onChange={(e) => handleTranslationChange(activeLang, 'shortName', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            バイオグラフィ / Biography
          </label>
          <textarea
            rows={5}
            value={formData.translations[activeLang].biography}
            onChange={(e) => handleTranslationChange(activeLang, 'biography', e.target.value)}
            className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-admin-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 border border-admin-border text-admin-text-primary text-sm font-medium rounded-lg hover:bg-admin-sidebar-bg transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </form>
  );
}
