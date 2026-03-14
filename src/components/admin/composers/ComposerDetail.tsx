'use client';

import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Tabs, type TabItem } from '@/components/ui/admin/Tabs';
import { ComposerEditForm } from './ComposerEditForm';

import { ComposerDto } from '@/application/composer/dto/composer.dto';

interface ComposerDetailProps {
  composer: ComposerDto;
  relatedWorks: { id: string; title: string; year: number | null }[];
}

/**
 * 未翻訳バッジ表示
 */
function UntranslatedBadge({ shown }: { shown: boolean }) {
  if (!shown) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 ml-2 text-[10px] font-medium bg-admin-warning/10 text-admin-warning border border-admin-warning/20 rounded align-middle">
      未翻訳 (JA)
    </span>
  );
}

/** 印象次元の表示ラベル定義 (-10 to +10) */
const DIMENSION_LABELS: Record<
  string,
  { label: string; negativeLabel: string; positiveLabel: string }
> = {
  innovation: { label: '革新性', negativeLabel: '伝統的', positiveLabel: '革新的' },
  emotionality: { label: '情動性', negativeLabel: '知的', positiveLabel: '感情的' },
  nationalism: { label: '民族性', negativeLabel: '国際的', positiveLabel: '民族的' },
  scale: { label: '規模感', negativeLabel: '親密', positiveLabel: '壮大' },
  complexity: { label: '複雑性', negativeLabel: '簡潔', positiveLabel: '複雑' },
  theatricality: { label: '演劇性', negativeLabel: '絶対音楽', positiveLabel: '演劇的' },
};

/** 拠点タイプの表示ラベル */
const PLACE_TYPE_LABELS: Record<string, string> = {
  birth: '生誕地',
  death: '没地',
  activity: '活動地',
  other: 'その他',
};

/**
 * 印象次元バーコンポーネント
 * -10 から +10 の値を中央基準のバーチャートで表示する
 */
function DimensionBar({ dimensionKey, value }: { dimensionKey: string; value: number }) {
  const config = DIMENSION_LABELS[dimensionKey];
  if (!config) return null;

  // -10 to +10 を 0-100% に正規化
  const _percentage = ((value + 10) / 20) * 100;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-16 text-xs text-admin-text-secondary text-right shrink-0">
        {config.label}
      </span>
      <div className="flex-1 relative">
        <div className="h-5 bg-admin-sidebar-bg rounded-full overflow-hidden relative">
          {/* 中央線 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-admin-border z-10" />
          {/* 値のバー */}
          {value >= 0 ? (
            <div
              className="absolute top-0 bottom-0 bg-admin-primary/60 rounded-r-full transition-all"
              style={{
                left: '50%',
                width: `${(value / 10) * 50}%`,
              }}
            />
          ) : (
            <div
              className="absolute top-0 bottom-0 bg-admin-primary/40 rounded-l-full transition-all"
              style={{
                right: '50%',
                width: `${(Math.abs(value) / 10) * 50}%`,
              }}
            />
          )}
        </div>
        {/* 軸ラベル */}
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-admin-text-secondary/60">{config.negativeLabel}</span>
          <span className="text-[10px] text-admin-text-secondary/60">{config.positiveLabel}</span>
        </div>
      </div>
      <span className="w-8 text-xs font-mono text-admin-text-primary text-right shrink-0">
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}

/**
 * タグバッジ表示
 */
function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-admin-sidebar-bg text-admin-text-primary border border-admin-border">
      {children}
    </span>
  );
}

/**
 * フィールドラベルと値の表示
 */
function FieldDisplay({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-1.5">
        {label}
      </dt>
      <dd className="text-sm text-admin-text-primary">{children}</dd>
    </div>
  );
}

/**
 * セクション見出し
 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-admin-text-primary border-b border-admin-border pb-2 mb-4">
      {children}
    </h3>
  );
}

/**
 * 矢印左アイコン
 */
function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

/**
 * 編集（ペン）アイコン
 */
function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

/**
 * ComposerDetail - 作曲家詳細 (Presentational Component)
 * ドメインモデルのほぼ全フィールドを2カラムレイアウトで表示する。
 * 編集モードへの切り替えと、一覧画面への戻りナビゲーションを提供する。
 */
export function ComposerDetail({ composer, relatedWorks }: ComposerDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = (params?.lang as string) || 'ja';
  const targetLang = searchParams.get('contentLang') || 'ja';

  /** 一覧画面へ戻る */
  const handleBackToList = () => {
    router.push(`/${lang}/admin/composers`);
  };

  // --- 表示用データの加工 ---
  const translationData = composer.translations[targetLang];
  const isUntranslated = !translationData && targetLang !== 'ja';

  const displayTranslation = translationData || composer.translations['ja'];
  const fullName = displayTranslation?.fullName || '';
  const displayName = displayTranslation?.displayName || composer.name;
  const shortName = displayTranslation?.shortName || '';

  const formatDate = (dateStr: string | null, format: 'date' | 'datetime' = 'date') => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (format === 'datetime') {
      return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
    return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  // --- 編集モード ---
  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* 戻るボタン */}
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary transition-colors"
        >
          <ArrowLeftIcon />
          <span>作曲家一覧に戻る</span>
        </button>

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Portrait */}
            {composer.portrait ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={composer.portrait}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-admin-border"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-admin-surface border-2 border-admin-border flex items-center justify-center">
                <span className="text-lg font-semibold text-admin-text-secondary">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <nav className="text-xs text-admin-text-secondary mb-1">
                管理画面 / 作曲家管理 / <span className="text-admin-primary">{displayName}</span>
              </nav>
              <h1 className="text-2xl font-bold text-admin-text-primary">
                {displayName} (編集)
                <UntranslatedBadge shown={isUntranslated} />
              </h1>
            </div>
          </div>
        </div>

        <ComposerEditForm composer={composer} onCancel={() => setIsEditing(false)} />
      </div>
    );
  }

  // --- 閲覧モード ---
  const tabs: TabItem[] = [
    {
      id: 'basic',
      label: '基本情報',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインカラム (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 共通情報セクション */}
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>共通情報</SectionHeading>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <FieldDisplay label="時代">{composer.era || '未設定'}</FieldDisplay>
                <FieldDisplay label="国籍">{composer.nationalityCode || '未設定'}</FieldDisplay>
                <FieldDisplay label="生年月日">{formatDate(composer.birthDate)}</FieldDisplay>
                <FieldDisplay label="没年月日">{formatDate(composer.deathDate)}</FieldDisplay>
              </dl>
            </div>

            {/* 多言語名称セクション */}
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>
                名称情報 (選択言語)
                <UntranslatedBadge shown={isUntranslated} />
              </SectionHeading>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <FieldDisplay label="正式名称 (Full Name)">{fullName || '-'}</FieldDisplay>
                <FieldDisplay label="表示名 (Display Name)">{displayName}</FieldDisplay>
                <FieldDisplay label="略称 (Short Name)">{shortName || '-'}</FieldDisplay>
              </dl>
            </div>

            {/* 要約 (Summary) */}
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>要約 (Summary)</SectionHeading>
              <p className="text-sm text-admin-text-primary leading-relaxed whitespace-pre-wrap">
                {composer.summary || '説明がありません'}
              </p>
            </div>

            {/* 音楽的特徴 */}
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>音楽的特徴</SectionHeading>
              <dl className="space-y-4">
                <FieldDisplay label="代表的な楽器">
                  {composer.representativeInstruments.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {composer.representativeInstruments.map((instrument) => (
                        <TagBadge key={instrument}>{instrument}</TagBadge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-admin-text-secondary">未設定</span>
                  )}
                </FieldDisplay>
                <FieldDisplay label="代表的なジャンル">
                  {composer.representativeGenres.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {composer.representativeGenres.map((genre) => (
                        <TagBadge key={genre}>{genre}</TagBadge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-admin-text-secondary">未設定</span>
                  )}
                </FieldDisplay>
                <FieldDisplay label="タグ">
                  {composer.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {composer.tags.map((tag) => (
                        <TagBadge key={tag}>{tag}</TagBadge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-admin-text-secondary">未設定</span>
                  )}
                </FieldDisplay>
              </dl>
            </div>

            {/* 活動拠点 */}
            {composer.places.length > 0 && (
              <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
                <SectionHeading>活動拠点</SectionHeading>
                <div className="space-y-2">
                  {composer.places.map((place, idx) => (
                    <div
                      key={`${place.slug}-${idx}`}
                      className="flex items-center gap-3 py-2 px-3 bg-admin-sidebar-bg rounded-md"
                    >
                      <span className="text-sm font-medium text-admin-text-primary">
                        {place.slug}
                      </span>
                      <span className="text-xs text-admin-text-secondary px-2 py-0.5 bg-admin-surface rounded">
                        {PLACE_TYPE_LABELS[place.type] || place.type}
                      </span>
                      {place.countryCode && (
                        <span className="text-xs text-admin-text-secondary font-mono">
                          {place.countryCode}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 印象次元 */}
            {composer.impressionDimensions && (
              <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
                <SectionHeading>印象次元</SectionHeading>
                <div className="space-y-1">
                  {Object.entries(composer.impressionDimensions).map(([key, value]) => (
                    <DimensionBar key={key} dimensionKey={key} value={value} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* サイドバー領域 (1/3) */}
          <div className="space-y-6">
            {/* ステータス・更新情報 */}
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>ステータス</SectionHeading>
              <dl className="space-y-3">
                <FieldDisplay label="作成日時">
                  {formatDate(composer.createdAt, 'datetime')}
                </FieldDisplay>
                <FieldDisplay label="最終更新日時">
                  {formatDate(composer.updatedAt, 'datetime')}
                </FieldDisplay>
              </dl>
            </div>

            {/* システム情報 */}
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>システム情報</SectionHeading>
              <dl className="space-y-3">
                <FieldDisplay label="ID (UUID)">
                  <span className="font-mono text-xs break-all">{composer.id}</span>
                </FieldDisplay>
                <FieldDisplay label="Slug">
                  <span className="font-mono">{composer.slug}</span>
                </FieldDisplay>
              </dl>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'works',
      label: '関連作品',
      content: (
        <div className="bg-admin-card-bg rounded-lg border border-admin-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-admin-sidebar-bg border-b border-admin-border text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                <th className="px-6 py-4">作品名</th>
                <th className="px-6 py-4">制作年</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border font-medium">
              {relatedWorks.map((work) => (
                <tr key={work.id} className="hover:bg-admin-primary-light/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-admin-text-primary">{work.title}</td>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary">
                    {work.year || '不明'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <button
        onClick={handleBackToList}
        className="inline-flex items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary transition-colors group"
      >
        <ArrowLeftIcon />
        <span className="group-hover:underline">作曲家一覧に戻る</span>
      </button>

      {/* ヘッダー領域 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          {/* Portrait */}
          {composer.portrait ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={composer.portrait}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-admin-border shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-admin-surface border-2 border-admin-border flex items-center justify-center shadow-sm">
              <span className="text-xl font-semibold text-admin-text-secondary">
                {displayName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <nav className="text-xs text-admin-text-secondary mb-1">
              管理画面 / 作曲家管理 / <span className="text-admin-primary">{displayName}</span>
            </nav>
            <h1 className="text-2xl font-bold text-admin-text-primary">
              {displayName}
              <UntranslatedBadge shown={isUntranslated} />
            </h1>
            {fullName && fullName !== displayName && (
              <p className="text-sm text-admin-text-secondary mt-0.5">{fullName}</p>
            )}
            <p className="text-xs text-admin-text-secondary/70 font-mono mt-1">{composer.slug}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary-hover active:bg-admin-primary-active disabled:bg-admin-primary-disabled disabled:cursor-not-allowed transition-colors"
          >
            <PencilIcon />
            編集
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
