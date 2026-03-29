'use client';

import React from 'react';
import { WorkPartType } from '@/domain/work/work-part.metadata';
import { WORK_PART_TYPE_LABELS } from '@/domain/shared/enum-labels';
import { AdminSelect, SelectOption } from '@/components/ui/admin/AdminSelect';

const OPTIONS: SelectOption<WorkPartType>[] = (
  Object.keys(WORK_PART_TYPE_LABELS) as WorkPartType[]
).map((key) => ({
  value: key,
  label: WORK_PART_TYPE_LABELS[key],
}));

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
  return (
    <AdminSelect<WorkPartType>
      id={id}
      label={label}
      value={value as WorkPartType}
      options={OPTIONS}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
