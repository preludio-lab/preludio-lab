import React from 'react';
import Link from 'next/link';
import { PhraseList } from '@/components/admin/phrases/PhraseList';
import { GetPhrasesUseCase } from '@/application/score/usecase/get-phrases.usecase';
import { PhraseRepositoryImpl } from '@/infrastructure/score/phrase.repository';
import { TursoPhraseDataSource } from '@/infrastructure/score/turso.phrase.ds';
import { TursoWorkDataSource } from '@/infrastructure/work/turso.work.ds';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { TursoScoreDataSource } from '@/infrastructure/score/turso.score.ds';
import { db } from '@/infrastructure/database/turso.client';

/**
 * PhrasesManagementPage - フレーズ管理・一覧ページ (Server Component)
 */
export default async function PhrasesManagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ workSlug?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const workSlug = sp.workSlug; // 特定楽曲のフレーズのみ絞る場合に利用

  // DI Setup
  const phraseDataSource = new TursoPhraseDataSource(db);
  const workDataSource = new TursoWorkDataSource(db);
  const composerDataSource = new TursoComposerDataSource(db);
  const scoreDataSource = new TursoScoreDataSource(db);

  const repository = new PhraseRepositoryImpl(
    phraseDataSource,
    workDataSource,
    composerDataSource,
    scoreDataSource,
  );

  const useCase = new GetPhrasesUseCase(repository);

  // データ取得
  const phrases = workSlug ? await useCase.getByWorkSlug(workSlug) : await useCase.getAll();

  // LocalizedPhraseDto への変換
  const phraseDtos = phrases.map((item) => {
    // 既に Mapper で Domain Object になっているので、そこから DTO を作成
    return {
      id: item.control.id,
      slug: item.control.slug,
      caption: item.metadata.caption?.ja || '',
      workSlug: item.metadata.workSlug,
      composerSlug: item.metadata.composerSlug,
      format: item.metadata.format,
      updatedAt: item.control.updatedAt.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">フレーズ管理</h1>
          <p className="text-sm text-admin-text-secondary mt-1">
            譜例（ABC/MusicXML）のメタデータ管理、小節範囲の設定、キャプションの翻訳を行います。
          </p>
        </div>
        <Link
          href={`/${p.lang}/admin/phrases/new`}
          className="px-4 py-2 bg-admin-primary text-white rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          新規フレーズ作成
        </Link>
      </div>

      <PhraseList phrases={phraseDtos} />

      {phraseDtos.length > 0 && (
        <div className="flex justify-between items-center text-sm text-admin-text-secondary mt-4">
          <span>全 {phraseDtos.length} 件を表示</span>
        </div>
      )}
    </div>
  );
}
