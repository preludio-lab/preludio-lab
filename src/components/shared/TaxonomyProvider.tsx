'use client';

import React from 'react';
import { taxonomy } from '@/domain/shared/taxonomy/TaxonomyRegistry';

interface TaxonomyProviderProps {
  data: Record<string, unknown>;
  children: React.ReactNode;
}

/**
 * タクソノミーデータをクライアント側のRegistryに同期するためのプロバイダー。
 * サーバーコンポーネントからデータを渡すことで、クライアント側でも localized なラベル取得が可能になります。
 */
export function TaxonomyProvider({ data, children }: TaxonomyProviderProps) {
  // 初回レンダリング時（およびデータ変更時）にRegistryを初期化
  // クライアントサイドでのシングルトンを populate する
  if (typeof window !== 'undefined') {
    taxonomy.initialize(data);
  }

  return <>{children}</>;
}
