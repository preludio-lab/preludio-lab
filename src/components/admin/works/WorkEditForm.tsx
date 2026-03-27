'use client';

import React, { useState, useTransition } from 'react';
import {
  WorkDetailDto,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '@/application/work/dto/work-detail.dto';
import { updateWorkAction } from '@/actions/work.action';
import { ComposerTypeahead } from '../shared/ComposerTypeahead';
import { DIMENSION_LABELS } from '@/components/ui/admin/DimensionBar';

interface WorkEditFormProps {
  work: WorkDetailDto;
  onCancel: () => void;
  onSuccess?: () => void;
}

const PART_TYPE_OPTIONS = [
  { value: 'movement', label: '楽章' },
  { value: 'number', label: '番号' },
  { value: 'act', label: '幕' },
  { value: 'scene', label: '場' },
  { value: 'variation', label: '変奏' },
  { value: 'section', label: 'セクション' },
  { value: 'part', label: '部' },
  { value: 'interlude', label: '間奏曲' },
  { value: 'supplement', label: '付録' },
];

interface WorkFormState {
  composerId: string;
  composerName: string;
  slug: string;
  era: string;
  compositionYear: string;
  instrumentation: string;
  performanceDifficulty: number;
  keyTonality: string;
  tempoText: string;
  genres: string[];
  tags: string[];
  instruments: string[];
  instrumentationFlags: {
    isSolo: boolean;
    isChamber: boolean;
    isOrchestral: boolean;
    hasVocal: boolean;
    hasChorus: boolean;
  };
  catalogues: Array<{ prefix: string; number: string; sortOrder: number; isPrimary: boolean }>;
  impressionDimensions: {
    innovation: number;
    emotionality: number;
    nationalism: number;
    scale: number;
    complexity: number;
    theatricality: number;
  };
  translations: Record<
    SupportedLanguage,
    {
      title: string;
      titlePrefix: string;
      titleContent: string;
      titleNickname: string;
      description: string;
    }
  >;
  parts: Array<{
    id: string;
    slug: string;
    sortOrder: number;
    type: string;
    isNameStandard: boolean;
    keyTonality: string;
    tempoText: string;
    performanceDifficulty: number;
    genres: string[];
    instruments: string[];
    translations: Record<
      SupportedLanguage,
      {
        title: string;
        titlePrefix: string;
        titleContent: string;
        titleNickname: string;
        tempoTranslation: string;
      }
    >;
  }>;
}

export function WorkEditForm({ work, onCancel, onSuccess }: WorkEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<SupportedLanguage>('ja');

  // Initialize form state
  const [formData, setFormData] = useState<WorkFormState>({
    composerId: work.composerId,
    composerName: work.composerName,
    slug: work.slug,
    era: work.era || '',
    compositionYear: work.compositionYear?.toString() || '',
    instrumentation: work.instrumentation || '',
    performanceDifficulty: work.performanceDifficulty || 3,
    keyTonality: work.keyTonality || '',
    tempoText: work.tempoText || '',
    genres: work.genres,
    tags: work.tags,
    instruments: work.instruments,
    instrumentationFlags: {
      isSolo: !!work.instrumentationFlags.isSolo,
      isChamber: !!work.instrumentationFlags.isChamber,
      isOrchestral: !!work.instrumentationFlags.isOrchestral,
      hasVocal: !!work.instrumentationFlags.hasVocal,
      hasChorus: !!work.instrumentationFlags.hasChorus,
    },
    catalogues: work.catalogues.map((c) => ({
      prefix: c.prefix || '',
      number: c.number || '',
      sortOrder: c.sortOrder || 0,
      isPrimary: !!c.isPrimary,
    })),
    impressionDimensions: {
      innovation: work.impressionDimensions?.innovation || 0,
      emotionality: work.impressionDimensions?.emotionality || 0,
      nationalism: work.impressionDimensions?.nationalism || 0,
      scale: work.impressionDimensions?.scale || 0,
      complexity: work.impressionDimensions?.complexity || 0,
      theatricality: work.impressionDimensions?.theatricality || 0,
    },
    translations: SUPPORTED_LANGUAGES.reduce(
      (acc, lang) => {
        const t = work.translations[lang];
        acc[lang] = {
          title: t?.title || '',
          titlePrefix: t?.titlePrefix || '',
          titleContent: t?.titleContent || '',
          titleNickname: t?.titleNickname || '',
          description: t?.description || '',
        };
        return acc;
      },
      {} as Record<SupportedLanguage, WorkFormState['translations'][SupportedLanguage]>,
    ),
    parts: work.parts.map((p) => ({
      id: p.id,
      slug: p.slug,
      sortOrder: p.sortOrder,
      type: p.type as string,
      isNameStandard: p.isNameStandard,
      keyTonality: p.keyTonality || '',
      tempoText: p.tempoText || '',
      performanceDifficulty: p.performanceDifficulty || 3,
      genres: p.genres,
      instruments: p.instruments,
      translations: SUPPORTED_LANGUAGES.reduce(
        (acc, lang) => {
          const t = p.translations[lang];
          acc[lang] = {
            title: t?.title || '',
            titlePrefix: t?.titlePrefix || '',
            titleContent: t?.titleContent || '',
            titleNickname: t?.titleNickname || '',
            tempoTranslation: t?.tempoTranslation || '',
          };
          return acc;
        },
        {} as Record<
          SupportedLanguage,
          WorkFormState['parts'][number]['translations'][SupportedLanguage]
        >,
      ),
    })),
  });

  const handleBasicChange = <K extends keyof WorkFormState>(field: K, value: WorkFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDimensionChange = (key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      impressionDimensions: { ...prev.impressionDimensions, [key]: value },
    }));
  };

  const handleTranslationChange = (lang: SupportedLanguage, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: { ...prev.translations[lang], [field]: value },
      },
    }));
  };

  const handleCatalogueChange = <K extends keyof WorkFormState['catalogues'][number]>(
    index: number,
    field: K,
    value: WorkFormState['catalogues'][number][K],
  ) => {
    const nextCatalogues = [...formData.catalogues];
    nextCatalogues[index] = { ...nextCatalogues[index], [field]: value };
    setFormData((prev) => ({ ...prev, catalogues: nextCatalogues }));
  };

  const addCatalogue = () => {
    setFormData((prev) => ({
      ...prev,
      catalogues: [
        ...prev.catalogues,
        { prefix: '', number: '', sortOrder: prev.catalogues.length, isPrimary: false },
      ],
    }));
  };

  const removeCatalogue = (index: number) => {
    setFormData((prev) => ({ ...prev, catalogues: prev.catalogues.filter((_, i) => i !== index) }));
  };

  const handlePartChange = <K extends keyof WorkFormState['parts'][number]>(
    index: number,
    field: K,
    value: WorkFormState['parts'][number][K],
  ) => {
    const nextParts = [...formData.parts];
    nextParts[index] = { ...nextParts[index], [field]: value };
    setFormData((prev) => ({ ...prev, parts: nextParts }));
  };

  const handlePartTranslationChange = (
    partIndex: number,
    lang: SupportedLanguage,
    field: string,
    value: string,
  ) => {
    const nextParts = [...formData.parts];
    const nextPart = { ...nextParts[partIndex] };
    nextPart.translations = {
      ...nextPart.translations,
      [lang]: { ...nextPart.translations[lang], [field]: value },
    };
    nextParts[partIndex] = nextPart;
    setFormData((prev) => ({ ...prev, parts: nextParts }));
  };

  const addPart = () => {
    const newPart: WorkFormState['parts'][number] = {
      id: crypto.randomUUID(),
      slug: `${formData.slug}-part-${formData.parts.length + 1}`,
      sortOrder: formData.parts.length + 1,
      type: 'movement',
      isNameStandard: true,
      keyTonality: '',
      tempoText: '',
      performanceDifficulty: 3,
      genres: [],
      instruments: [],
      translations: SUPPORTED_LANGUAGES.reduce(
        (acc, lang) => {
          acc[lang] = {
            title: '',
            titlePrefix: '',
            titleContent: '',
            titleNickname: '',
            tempoTranslation: '',
          };
          return acc;
        },
        {} as Record<
          SupportedLanguage,
          WorkFormState['parts'][number]['translations'][SupportedLanguage]
        >,
      ),
    };
    setFormData((prev) => ({ ...prev, parts: [...prev.parts, newPart] }));
  };

  const removePart = (index: number) => {
    setFormData((prev) => ({ ...prev, parts: prev.parts.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    const payload = {
      id: work.id,
      composerId: formData.composerId,
      slug: formData.slug,
      updatedAt: work.updatedAt,
      era: formData.era || null,
      compositionYear: formData.compositionYear ? parseInt(formData.compositionYear, 10) : null,
      instrumentation: formData.instrumentation || null,
      performanceDifficulty: formData.performanceDifficulty,
      keyTonality: formData.keyTonality || null,
      tempoText: formData.tempoText || null,
      catalogues: formData.catalogues,
      genres: formData.genres,
      tags: formData.tags,
      instruments: formData.instruments,
      instrumentationFlags: formData.instrumentationFlags,
      impressionDimensions: formData.impressionDimensions,
      translations: formData.translations,
      parts: formData.parts,
    };

    const submitData = new FormData();
    submitData.set('data', JSON.stringify(payload));

    startTransition(async () => {
      try {
        const result = await updateWorkAction(null, submitData);
        if (result.success) {
          if (onSuccess) onSuccess();
          else window.location.reload();
        } else {
          setErrorStatus(result.message || '保存に失敗しました');
        }
      } catch (err) {
        setErrorStatus(err instanceof Error ? err.message : 'システムエラーが発生しました');
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-admin-card-bg rounded-lg border border-admin-border p-6 shadow-sm"
    >
      {errorStatus && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md text-sm">
          {errorStatus}
        </div>
      )}

      {/* Basic Info Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-admin-text-primary border-b border-admin-border pb-2">
          基本情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              作曲家
            </label>
            <ComposerTypeahead
              selectedId={formData.composerId}
              selectedName={formData.composerName}
              onSelect={(c) => {
                handleBasicChange('composerId', c.id);
                handleBasicChange('composerName', c.displayName);
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              スラッグ (URL)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleBasicChange('slug', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              時代 (Era)
            </label>
            <input
              type="text"
              value={formData.era}
              onChange={(e) => handleBasicChange('era', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              作曲年
            </label>
            <input
              type="number"
              value={formData.compositionYear}
              onChange={(e) => handleBasicChange('compositionYear', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              調性
            </label>
            <input
              type="text"
              value={formData.keyTonality}
              onChange={(e) => handleBasicChange('keyTonality', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
              placeholder="e.g. D minor"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              テンポ記号 (原語)
            </label>
            <input
              type="text"
              value={formData.tempoText}
              onChange={(e) => handleBasicChange('tempoText', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
              placeholder="e.g. Allegro"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              演奏難易度 (1-5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={formData.performanceDifficulty}
              onChange={(e) =>
                handleBasicChange('performanceDifficulty', parseInt(e.target.value, 10))
              }
              className="w-full accent-admin-primary mt-2"
            />
            <div className="flex justify-between text-[10px] text-admin-text-secondary mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* Catalogues */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-admin-text-secondary uppercase">
              カタログ番号
            </label>
            <button
              type="button"
              onClick={addCatalogue}
              className="text-[10px] text-admin-primary font-bold hover:underline"
            >
              + 追加
            </button>
          </div>
          <div className="space-y-2">
            {formData.catalogues.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Prefix (e.g. K.)"
                  value={cat.prefix}
                  onChange={(e) => handleCatalogueChange(idx, 'prefix', e.target.value)}
                  className="w-24 bg-admin-sidebar-bg border border-admin-border rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  placeholder="Number"
                  value={cat.number}
                  onChange={(e) => handleCatalogueChange(idx, 'number', e.target.value)}
                  className="flex-1 bg-admin-sidebar-bg border border-admin-border rounded px-2 py-1 text-xs"
                />
                <label className="flex items-center gap-1 text-[10px] text-admin-text-secondary whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={cat.isPrimary}
                    onChange={(e) => handleCatalogueChange(idx, 'isPrimary', e.target.checked)}
                    className="rounded border-admin-border text-admin-primary focus:ring-admin-primary bg-admin-sidebar-bg h-3 w-3"
                  />
                  主力
                </label>
                <button
                  type="button"
                  onClick={() => removeCatalogue(idx)}
                  className="text-red-500 text-xs px-1"
                >
                  ×
                </button>
              </div>
            ))}
            {formData.catalogues.length === 0 && (
              <p className="text-xs text-admin-text-secondary italic">
                カタログ番号が登録されていません
              </p>
            )}
          </div>
        </div>

        {/* Impression Dimensions */}
        <div className="space-y-4 pt-4 border-t border-admin-border/50">
          <label className="block text-xs font-bold text-admin-text-secondary uppercase">
            印象評価 (-10 〜 +10)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {Object.keys(DIMENSION_LABELS).map((key) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-admin-text-primary capitalize">{key}</span>
                  <span className="text-[11px] font-mono text-admin-primary font-bold">
                    {formData.impressionDimensions[
                      key as keyof typeof formData.impressionDimensions
                    ] > 0
                      ? '+'
                      : ''}
                    {
                      formData.impressionDimensions[
                        key as keyof typeof formData.impressionDimensions
                      ]
                    }
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={
                    formData.impressionDimensions[key as keyof typeof formData.impressionDimensions]
                  }
                  onChange={(e) => handleDimensionChange(key, parseInt(e.target.value, 10))}
                  className="w-full accent-admin-primary h-1.5"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Musical Features & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-admin-border/50">
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              ジャンル (カンマ区切り)
            </label>
            <input
              type="text"
              value={formData.genres.join(', ')}
              onChange={(e) =>
                handleBasicChange(
                  'genres',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
              placeholder="e.g. Concerto, Piano"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              楽器 (カンマ区切り)
            </label>
            <input
              type="text"
              value={formData.instruments.join(', ')}
              onChange={(e) =>
                handleBasicChange(
                  'instruments',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
              placeholder="e.g. Piano, Orchestra"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              タグ (カンマ区切り)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                handleBasicChange(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
              placeholder="e.g. Masterpiece, Dark, K.466"
            />
          </div>
        </div>

        {/* Instrumentation Flags */}
        <div className="pt-4 border-t border-admin-border/50">
          <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-3">
            編成フラグ
          </label>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { key: 'isSolo', label: '独奏 (Solo)' },
              { key: 'isChamber', label: '室内楽 (Chamber)' },
              { key: 'isOrchestral', label: '管弦楽 (Orchestral)' },
              { key: 'hasVocal', label: '声楽あり (Vocal)' },
              { key: 'hasChorus', label: '合唱あり (Chorus)' },
            ].map((flag) => (
              <label key={flag.key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={
                    formData.instrumentationFlags[
                      flag.key as keyof typeof formData.instrumentationFlags
                    ]
                  }
                  onChange={(e) => {
                    const nextFlags = {
                      ...formData.instrumentationFlags,
                      [flag.key]: e.target.checked,
                    };
                    handleBasicChange('instrumentationFlags', nextFlags);
                  }}
                  className="rounded border-admin-border text-admin-primary focus:ring-admin-primary bg-admin-sidebar-bg h-4 w-4"
                />
                <span className="text-sm text-admin-text-primary group-hover:text-admin-primary transition-colors">
                  {flag.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Multilingual Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-admin-text-primary border-b border-admin-border pb-2">
          多言語情報
        </h3>
        <div className="flex space-x-1 border-b border-admin-border mb-4 overflow-x-auto pb-px">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-t border-x ${
                activeLang === lang
                  ? 'bg-admin-card-bg text-admin-primary border-admin-border -mb-px relative z-10'
                  : 'bg-admin-sidebar-bg text-admin-text-secondary border-transparent hover:text-admin-text-primary'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              正式タイトル
            </label>
            <input
              type="text"
              value={formData.translations[activeLang].title}
              onChange={(e) => handleTranslationChange(activeLang, 'title', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm font-medium"
              required={activeLang === 'ja' || activeLang === 'en'}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              タイトル接頭辞 (Prefix)
            </label>
            <input
              type="text"
              value={formData.translations[activeLang].titlePrefix}
              onChange={(e) => handleTranslationChange(activeLang, 'titlePrefix', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              タイトル本旨 (Content)
            </label>
            <input
              type="text"
              value={formData.translations[activeLang].titleContent}
              onChange={(e) => handleTranslationChange(activeLang, 'titleContent', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              通称 (Nickname)
            </label>
            <input
              type="text"
              value={formData.translations[activeLang].titleNickname}
              onChange={(e) => handleTranslationChange(activeLang, 'titleNickname', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-1.5">
              解説 (Description)
            </label>
            <textarea
              rows={6}
              value={formData.translations[activeLang].description}
              onChange={(e) => handleTranslationChange(activeLang, 'description', e.target.value)}
              className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm leading-relaxed"
            />
          </div>
        </div>
      </section>

      {/* WorkParts Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-admin-border pb-2">
          <h3 className="text-lg font-bold text-admin-text-primary">
            構成・楽章 ({formData.parts.length})
          </h3>
          <button
            type="button"
            onClick={addPart}
            className="text-xs font-bold text-admin-primary hover:underline flex items-center gap-1"
          >
            <span>+ 楽章を追加</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.parts.map((part, index) => (
            <div
              key={part.id}
              className="border border-admin-border rounded-lg overflow-hidden bg-admin-sidebar-bg/30"
            >
              <div className="bg-admin-sidebar-bg px-4 py-2 flex items-center justify-between border-b border-admin-border">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-admin-text-secondary">
                    #{part.sortOrder}
                  </span>
                  <input
                    type="text"
                    value={part.translations[activeLang].title || part.slug}
                    readOnly
                    className="bg-transparent text-sm font-bold text-admin-text-primary focus:outline-none overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePart(index)}
                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  削除
                </button>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-admin-text-secondary uppercase mb-1">
                    タイトル ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={part.translations[activeLang].title}
                    onChange={(e) =>
                      handlePartTranslationChange(index, activeLang, 'title', e.target.value)
                    }
                    className="w-full bg-admin-card-bg border border-admin-border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-admin-text-secondary uppercase mb-1">
                    スラッグ
                  </label>
                  <input
                    type="text"
                    value={part.slug}
                    onChange={(e) => handlePartChange(index, 'slug', e.target.value)}
                    className="w-full bg-admin-card-bg border border-admin-border rounded px-2 py-1.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-admin-text-secondary uppercase mb-1">
                    種別
                  </label>
                  <select
                    value={part.type}
                    onChange={(e) => handlePartChange(index, 'type', e.target.value)}
                    className="w-full bg-admin-card-bg border border-admin-border rounded px-2 py-1.5 text-sm"
                  >
                    {PART_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-admin-text-secondary uppercase mb-1">
                    調性
                  </label>
                  <input
                    type="text"
                    value={part.keyTonality}
                    onChange={(e) => handlePartChange(index, 'keyTonality', e.target.value)}
                    className="w-full bg-admin-card-bg border border-admin-border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-admin-text-secondary uppercase mb-1">
                    テンポ (原語)
                  </label>
                  <input
                    type="text"
                    value={part.tempoText}
                    onChange={(e) => handlePartChange(index, 'tempoText', e.target.value)}
                    className="w-full bg-admin-card-bg border border-admin-border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-admin-text-secondary uppercase mb-1">
                    テンポ訳 ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={part.translations[activeLang].tempoTranslation}
                    onChange={(e) =>
                      handlePartTranslationChange(
                        index,
                        activeLang,
                        'tempoTranslation',
                        e.target.value,
                      )
                    }
                    className="w-full bg-admin-card-bg border border-admin-border rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-admin-border sticky bottom-0 bg-admin-card-bg/80 backdrop-blur-sm -mx-6 px-6 pb-6 rounded-b-lg">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-6 py-2 border border-admin-border text-admin-text-primary text-sm font-bold rounded-lg hover:bg-admin-sidebar-bg transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-admin-primary text-white text-sm font-bold rounded-lg hover:bg-admin-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-admin-primary/20"
        >
          {isPending ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </form>
  );
}
