'use client';

import React from 'react';
import { MUSICAL_INSTRUMENT_LABELS } from '@/domain/shared/enum-labels';
import { AdminMultiSelect, MultiSelectOption } from '@/components/ui/admin/AdminMultiSelect';

const OPTIONS: MultiSelectOption<string>[] = (
  Object.keys(MUSICAL_INSTRUMENT_LABELS) as (keyof typeof MUSICAL_INSTRUMENT_LABELS)[]
).map((key) => ({
  value: key,
  label: MUSICAL_INSTRUMENT_LABELS[key],
}));

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
  return (
    <AdminMultiSelect<string>
      id={id}
      label={label}
      values={values}
      options={OPTIONS}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
