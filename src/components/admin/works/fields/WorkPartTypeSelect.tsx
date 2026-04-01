'use client';

import React from 'react';
import { WorkPartType } from '@/domain/work/work-part.metadata';
import { getWorkPartTypeLabel } from '@/domain/shared/enum-labels';
import { AdminSelect, SelectOption } from '@/components/ui/admin/AdminSelect';
import { useLocale } from 'next-intl';
import { AppLocale } from '@/domain/i18n/locale';

interface WorkPartTypeSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * WorkPartTypeSelect - 楽章区分（種別）選択コンポーネント
 */
export function WorkPartTypeSelect({
  id,
  label = '種別',
  value,
  onChange,
  placeholder = '種類を選択...',
  className = '',
  error,
  disabled = false,
}: WorkPartTypeSelectProps) {
  const locale = useLocale() as AppLocale;

  // ラベルを多言語設定
  const options: SelectOption<WorkPartType>[] = [
    'movement',
    'number',
    'act',
    'scene',
    'variation',
    'section',
    'part',
    'interlude',
    'supplement',
  ].map((type) => ({
    value: type as WorkPartType,
    label: getWorkPartTypeLabel(type as WorkPartType, locale),
  }));

  return (
    <AdminSelect<WorkPartType>
      id={id}
      label={label}
      value={value as WorkPartType}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
