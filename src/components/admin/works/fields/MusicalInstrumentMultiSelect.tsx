'use client';

import React from 'react';
import { getMusicalInstrumentLabel, MUSICAL_INSTRUMENT_LABELS } from '@/domain/shared/enum-labels';
import { AdminMultiSelect, MultiSelectOption } from '@/components/ui/admin/AdminMultiSelect';
import { useLocale } from 'next-intl';
import { AppLocale } from '@/domain/i18n/locale';
import { MusicalInstrument } from '@/domain/shared/musical-instrument';

interface MusicalInstrumentMultiSelectProps {
  id?: string;
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * MusicalInstrumentMultiSelect - 楽器マルチセレクト
 */
export function MusicalInstrumentMultiSelect({
  id,
  label = '楽器 (Instrument)',
  values,
  onChange,
  placeholder = '楽器を選択...',
  className = '',
  error,
  disabled = false,
}: MusicalInstrumentMultiSelectProps) {
  const locale = useLocale() as AppLocale;

  // ラベルを多言語設定
  const options: MultiSelectOption<string>[] = Object.keys(MUSICAL_INSTRUMENT_LABELS).map(
    (key) => ({
      value: key,
      label: getMusicalInstrumentLabel(key as MusicalInstrument, locale),
    }),
  );

  return (
    <AdminMultiSelect<string>
      id={id}
      label={label}
      values={values}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
