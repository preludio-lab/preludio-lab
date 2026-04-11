'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { PhraseMetadataSchema, NotationFormat } from '@/domain/score/phrase.metadata';
import { Phrase } from '@/domain/score/phrase';
import { AppLocale } from '@/domain/i18n/locale';
import { z } from 'zod';

type PhraseFormValues = z.infer<typeof PhraseMetadataSchema>;

interface PhraseFormProps {
  initialData?: Phrase | null;
  onSubmit: (data: PhraseFormValues) => Promise<{ error?: string } | void>;
  isSubmitting?: boolean;
}

/**
 * PhraseForm - フレーズ作成・編集フォーム
 */
export function PhraseForm({
  initialData,
  onSubmit,
  isSubmitting: isExternalSubmitting,
}: PhraseFormProps) {
  const [internalSubmitting, setInternalSubmitting] = React.useState(false);
  const isSubmitting = isExternalSubmitting || internalSubmitting;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhraseFormValues>({
    resolver: zodResolver(PhraseMetadataSchema),
    defaultValues: {
      slug: initialData?.control?.slug || '',
      composerSlug: initialData?.metadata?.composerSlug || '',
      workSlug: initialData?.metadata?.workSlug || '',
      workPartSlug: initialData?.metadata?.workPartSlug || '',
      scoreSlug: initialData?.metadata?.scoreSlug || '',
      format: initialData?.metadata?.format || NotationFormat.ABC,
      notationPath: initialData?.metadata?.notationPath || '',
      caption: {
        [AppLocale.JA]: initialData?.metadata?.caption?.[AppLocale.JA] || '',
        [AppLocale.EN]: initialData?.metadata?.caption?.[AppLocale.EN] || '',
      },
    },
  });

  const onFormSubmit = async (data: PhraseFormValues) => {
    setInternalSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-admin-surface border border-admin-divider rounded-xl p-8 space-y-8 shadow-sm"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identifier & Logic */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-admin-text-primary border-l-2 border-admin-primary pl-2 uppercase tracking-wider">
              Identifier & Logic
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-admin-text-secondary uppercase">
                Phrase Slug (必須)
              </label>
              <input
                {...register('slug')}
                className="w-full px-4 py-2.5 bg-admin-input-bg border border-admin-divider rounded-lg focus:ring-1 focus:ring-admin-primary outline-none text-sm transition-all text-white"
                placeholder="e.g. m1-first-theme"
              />
              {errors.slug && (
                <p className="text-xs text-red-500 mt-1">{errors.slug.message as string}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-admin-text-secondary uppercase">
                Work Slug (論理参照)
              </label>
              <input
                {...register('workSlug')}
                className="w-full px-4 py-2.5 bg-admin-input-bg border border-admin-divider rounded-lg focus:ring-1 focus:ring-admin-primary outline-none text-sm transition-all text-white"
                placeholder="e.g. beethoven-sym5"
              />
            </div>
          </div>

          {/* Notation Specs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-admin-text-primary border-l-2 border-admin-primary pl-2 uppercase tracking-wider">
              Notation Specs
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-admin-text-secondary uppercase">
                Format
              </label>
              <select
                {...register('format')}
                className="w-full px-4 py-2.5 bg-admin-input-bg border border-admin-divider rounded-lg focus:ring-1 focus:ring-admin-primary outline-none text-sm transition-all text-white"
              >
                <option value={NotationFormat.ABC}>ABC Notation</option>
                <option value={NotationFormat.MUSICXML}>MusicXML</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-admin-text-secondary uppercase">
                Notation Storage Path
              </label>
              <input
                {...register('notationPath')}
                className="w-full px-4 py-2.5 bg-admin-input-bg border border-admin-divider rounded-lg focus:ring-1 focus:ring-admin-primary outline-none text-sm transition-all text-white"
                placeholder="e.g. phrases/beethoven/.../theme.abc"
              />
              {errors.notationPath && (
                <p className="text-xs text-red-500 mt-1">{errors.notationPath.message as string}</p>
              )}
            </div>
          </div>
        </div>

        {/* Captions (Multilingual) */}
        <div className="space-y-4 pt-4 border-t border-admin-divider">
          <h3 className="text-sm font-semibold text-admin-text-primary border-l-2 border-admin-primary pl-2 uppercase tracking-wider">
            Captions (Multilingual)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-admin-text-secondary uppercase">
                日本語 (ja) - 必須
              </label>
              <input
                {...register('caption.ja')}
                className="w-full px-4 py-2.5 bg-admin-input-bg border border-admin-divider rounded-lg focus:ring-1 focus:ring-admin-primary outline-none text-sm transition-all text-white"
                placeholder="フレーズの短い説明 (例: 第1主題)"
              />
              {errors.caption?.ja && (
                <p className="text-xs text-red-500 mt-1">{errors.caption.ja.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-admin-text-secondary uppercase">
                English (en)
              </label>
              <input
                {...register('caption.en')}
                className="w-full px-4 py-2.5 bg-admin-input-bg border border-admin-divider rounded-lg focus:ring-1 focus:ring-admin-primary outline-none text-sm transition-all text-white"
                placeholder="e.g. First Theme"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-admin-primary text-white rounded-lg font-medium hover:bg-admin-primary/95 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : 'フレーズを保存'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
