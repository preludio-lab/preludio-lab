'use client';

import React from 'react';
import { MusicalEra } from '@/domain/shared/musical-era';
import { getMusicalEraLabel } from '@/domain/shared/enum-labels';
import { AdminSelect, SelectOption } from '@/components/ui/admin/AdminSelect';
import { useLocale } from 'next-intl';
import { AppLocale } from '@/domain/i18n/locale';

interface MusicalEraSelectProps {
  id?: string;
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * MusicalEraSelect - 時代選択コンポーネント
 */
export function MusicalEraSelect({
  id,
  label = '時代 (Era)',
  value,
  onChange,
  placeholder = '時代を選択...',
  className = '',
  error,
  disabled = false,
}: MusicalEraSelectProps) {
  const locale = useLocale() as AppLocale;

  // 全てのEraキーを取得してラベルを多言設定
  const options: SelectOption<MusicalEra>[] = Object.values(MusicalEra).map((eraValue) => ({
    value: eraValue as MusicalEra,
    label: getMusicalEraLabel(eraValue, locale),
  }));

  return (
    <AdminSelect<MusicalEra>
      id={id}
      label={label}
      value={value as MusicalEra}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
