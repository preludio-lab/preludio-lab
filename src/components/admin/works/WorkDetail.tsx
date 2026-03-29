'use client';

import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Tabs, type TabItem } from '@/components/ui/admin/Tabs';
import { DimensionBar, WORK_DIMENSION_LABELS } from '@/components/ui/admin/DimensionBar';
import type { WorkDetailDto, SupportedLanguage } from '@/application/work/dto/work-detail.dto';
import { WorkEditForm } from './WorkEditForm';

// --- Helper Components ---

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-admin-text-primary border-b border-admin-border pb-2 mb-4">
      {children}
    </h3>
  );
}

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

function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-admin-sidebar-bg text-admin-text-primary border border-admin-border">
      {children}
    </span>
  );
}

function UntranslatedBadge({ shown }: { shown: boolean }) {
  if (!shown) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 ml-2 text-[10px] font-medium bg-admin-warning/10 text-admin-warning border border-admin-warning/20 rounded align-middle">
      未翻訳 (JA)
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// --- Part Type Labels ---
const PART_TYPE_LABELS: Record<string, string> = {
  movement: '楽章',
  number: '番号',
  act: '幕',
  scene: '場',
  variation: '変奏',
  section: 'セクション',
  part: '部',
  interlude: '間奏曲',
  supplement: '付録',
};

// --- Main Component ---

interface WorkDetailProps {
  work: WorkDetailDto;
}

/**
 * WorkDetail - 作品詳細 (Presentational Component)
 */
export function WorkDetail({ work }: WorkDetailProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = (params?.lang as string) || 'ja';
  const targetLang = (searchParams.get('contentLang') || 'ja') as SupportedLanguage;

  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);

  const handleBackToList = () => {
    router.push(`/${lang}/admin/works`);
  };

  const togglePart = (partId: string) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  // --- i18n Resolution ---
  const workTranslation = work.translations[targetLang] ?? work.translations['ja'];
  const isUntranslated = !work.translations[targetLang] && targetLang !== 'ja';
  const displayTitle = workTranslation?.title ?? 'Untitled';

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

  const catalogueDisplay =
    work.catalogues
      .filter((c) => c.prefix || c.number)
      .map((c) => `${c.prefix ?? ''} ${c.number ?? ''}`.trim())
      .join(', ') || '-';

  // --- Tab: Basic Info ---
  const basicInfoTab: TabItem = {
    id: 'basic',
    label: '基本情報',
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Common Info */}
          <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
            <SectionHeading>共通情報</SectionHeading>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <FieldDisplay label="時代 (Era)">{work.era || '未設定'}</FieldDisplay>
              <FieldDisplay label="カタログ番号">{catalogueDisplay}</FieldDisplay>
              <FieldDisplay label="調性">{work.keyTonality || '未設定'}</FieldDisplay>
              <FieldDisplay label="テンポ">{work.tempoText || '未設定'}</FieldDisplay>
              <FieldDisplay label="作曲年">{work.compositionYear ?? '不明'}</FieldDisplay>
              <FieldDisplay label="拍子">
                {work.tsDisplayString ||
                  (work.tsNumerator && work.tsDenominator
                    ? `${work.tsNumerator}/${work.tsDenominator}`
                    : '未設定')}
              </FieldDisplay>
              <FieldDisplay label="BPM">
                {work.bpm ? `♩ = ${work.bpm} ${work.metronomeUnit || ''}` : '未設定'}
              </FieldDisplay>
              <FieldDisplay label="楽器編成">{work.instrumentation || '未設定'}</FieldDisplay>
              <FieldDisplay label="演奏難易度">
                {work.performanceDifficulty ? `${work.performanceDifficulty}/5` : '未設定'}
              </FieldDisplay>
              <FieldDisplay label="作曲家">
                <span className="underline decoration-admin-primary/30 cursor-pointer">
                  {work.composerName}
                </span>
              </FieldDisplay>
            </dl>
          </div>

          {/* Impression Dimensions */}
          {work.impressionDimensions && (
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>印象評価 (Impression)</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                {Object.keys(WORK_DIMENSION_LABELS).map((key) => (
                  <DimensionBar
                    key={key}
                    dimensionKey={key}
                    labels={WORK_DIMENSION_LABELS}
                    value={work.impressionDimensions?.[key] ?? 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Title (i18n) */}
          <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
            <SectionHeading>
              タイトル情報 (選択言語)
              <UntranslatedBadge shown={isUntranslated} />
            </SectionHeading>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <FieldDisplay label="タイトル">{workTranslation?.title || '-'}</FieldDisplay>
              <FieldDisplay label="接頭辞 (Prefix)">
                {workTranslation?.titlePrefix || '-'}
              </FieldDisplay>
              <FieldDisplay label="内容 (Content)">
                {workTranslation?.titleContent || '-'}
              </FieldDisplay>
              <FieldDisplay label="通称 (Nickname)">
                {workTranslation?.titleNickname || '-'}
              </FieldDisplay>
              <FieldDisplay label="作曲時期 (Period)">
                {workTranslation?.compositionPeriod || '-'}
              </FieldDisplay>
              {workTranslation?.nicknames && workTranslation.nicknames.length > 0 && (
                <FieldDisplay label="検索用別名" className="sm:col-span-2">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {workTranslation.nicknames.map((n) => (
                      <TagBadge key={n}>{n}</TagBadge>
                    ))}
                  </div>
                </FieldDisplay>
              )}
            </dl>
          </div>

          {/* Description */}
          <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
            <SectionHeading>解説</SectionHeading>
            <p className="text-sm text-admin-text-primary leading-relaxed whitespace-pre-wrap">
              {workTranslation?.description || '解説がありません'}
            </p>
          </div>

          {/* Tags & Genres */}
          <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
            <SectionHeading>音楽的特徴</SectionHeading>
            <dl className="space-y-4">
              <FieldDisplay label="ジャンル">
                {work.genres.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {work.genres.map((g) => (
                      <TagBadge key={g}>{g}</TagBadge>
                    ))}
                  </div>
                ) : (
                  <span className="text-admin-text-secondary">未設定</span>
                )}
              </FieldDisplay>
              <FieldDisplay label="楽器">
                {work.instruments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {work.instruments.map((i) => (
                      <TagBadge key={i}>{i}</TagBadge>
                    ))}
                  </div>
                ) : (
                  <span className="text-admin-text-secondary">未設定</span>
                )}
              </FieldDisplay>
              <FieldDisplay label="タグ">
                {work.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {work.tags.map((t) => (
                      <TagBadge key={t}>{t}</TagBadge>
                    ))}
                  </div>
                ) : (
                  <span className="text-admin-text-secondary">未設定</span>
                )}
              </FieldDisplay>
              <FieldDisplay label="編成フラグ">
                <div className="flex flex-wrap gap-2 mt-1">
                  {work.instrumentationFlags.isSolo && <TagBadge>独奏 (Solo)</TagBadge>}
                  {work.instrumentationFlags.isChamber && <TagBadge>室内楽 (Chamber)</TagBadge>}
                  {work.instrumentationFlags.isOrchestral && (
                    <TagBadge>管弦楽 (Orchestral)</TagBadge>
                  )}
                  {work.instrumentationFlags.hasVocal && <TagBadge>声楽あり (Vocal)</TagBadge>}
                  {work.instrumentationFlags.hasChorus && <TagBadge>合唱あり (Chorus)</TagBadge>}
                  {!Object.values(work.instrumentationFlags).some(Boolean) && (
                    <span className="text-admin-text-secondary italic">なし</span>
                  )}
                </div>
              </FieldDisplay>
            </dl>
          </div>

          {/* WorkParts Section */}
          {work.parts.length > 0 && (
            <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
              <SectionHeading>構成・楽章 ({work.parts.length}件)</SectionHeading>
              <div className="space-y-2">
                {work.parts.map((part) => {
                  const isOpen = expandedParts.has(part.id);
                  const partTranslation = part.translations[targetLang] ?? part.translations['ja'];
                  const partTitle = partTranslation?.title ?? part.slug;
                  const typeLabel = PART_TYPE_LABELS[part.type] || part.type;

                  return (
                    <div
                      key={part.id}
                      className="border border-admin-border rounded-lg overflow-hidden"
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() => togglePart(part.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-admin-sidebar-bg hover:bg-admin-sidebar-bg/80 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-admin-text-secondary bg-admin-surface px-2 py-0.5 rounded">
                            #{part.sortOrder}
                          </span>
                          <span className="text-sm font-medium text-admin-text-primary">
                            {partTitle}
                          </span>
                          <span className="text-xs text-admin-text-secondary px-1.5 py-0.5 bg-admin-surface rounded">
                            {typeLabel}
                          </span>
                        </div>
                        <ChevronIcon open={isOpen} />
                      </button>

                      {/* Accordion Content */}
                      {isOpen && (
                        <div className="px-4 py-4 bg-admin-card-bg border-t border-admin-border">
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            <FieldDisplay label="タイトル">
                              {partTranslation?.title || '-'}
                            </FieldDisplay>
                            <FieldDisplay label="接頭辞">
                              {partTranslation?.titlePrefix || '-'}
                            </FieldDisplay>
                            <FieldDisplay label="内容">
                              {partTranslation?.titleContent || '-'}
                            </FieldDisplay>
                            <FieldDisplay label="通称">
                              {partTranslation?.titleNickname || '-'}
                            </FieldDisplay>
                            <FieldDisplay label="調性">{part.keyTonality || '-'}</FieldDisplay>
                            <FieldDisplay label="テンポ">{part.tempoText || '-'}</FieldDisplay>
                            <FieldDisplay label="テンポ翻訳">
                              {partTranslation?.tempoTranslation || '-'}
                            </FieldDisplay>
                            <FieldDisplay label="標準名称">
                              {part.isNameStandard ? 'はい' : 'いいえ'}
                            </FieldDisplay>
                            <FieldDisplay label="演奏難易度">
                              {part.performanceDifficulty ? `${part.performanceDifficulty}/5` : '-'}
                            </FieldDisplay>
                            {part.catalogues.length > 0 && (
                              <FieldDisplay label="カタログ番号">
                                {part.catalogues
                                  .map((c) => `${c.prefix ?? ''}${c.number ?? ''}`)
                                  .join(', ')}
                              </FieldDisplay>
                            )}

                            <div className="sm:col-span-2 mt-2 pt-2 border-t border-admin-border/50">
                              <dt className="text-[10px] font-semibold text-admin-text-secondary uppercase mb-2">
                                印象次元
                              </dt>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                {Object.keys(WORK_DIMENSION_LABELS).map((key) => (
                                  <DimensionBar
                                    key={key}
                                    dimensionKey={key}
                                    labels={WORK_DIMENSION_LABELS}
                                    value={part.impressionDimensions?.[key] ?? 0}
                                  />
                                ))}
                              </div>
                            </div>

                            {part.genres.length > 0 && (
                              <FieldDisplay label="ジャンル" className="sm:col-span-2">
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {part.genres.map((g) => (
                                    <TagBadge key={g}>{g}</TagBadge>
                                  ))}
                                </div>
                              </FieldDisplay>
                            )}
                            {part.instruments.length > 0 && (
                              <FieldDisplay label="楽器" className="sm:col-span-2">
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {part.instruments.map((i) => (
                                    <TagBadge key={i}>{i}</TagBadge>
                                  ))}
                                </div>
                              </FieldDisplay>
                            )}
                          </dl>
                          {partTranslation?.description && (
                            <div className="mt-4 pt-4 border-t border-admin-border">
                              <dt className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                                解説
                              </dt>
                              <dd className="text-sm text-admin-text-primary leading-relaxed whitespace-pre-wrap">
                                {partTranslation.description}
                              </dd>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-admin-border">
                            <span className="text-[11px] font-mono text-admin-text-secondary/60 break-all">
                              ID: {part.id} | Slug: {part.slug}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
            <SectionHeading>ステータス</SectionHeading>
            <dl className="space-y-3">
              <FieldDisplay label="作成日時">{formatDate(work.createdAt, 'datetime')}</FieldDisplay>
              <FieldDisplay label="最終更新日時">
                {formatDate(work.updatedAt, 'datetime')}
              </FieldDisplay>
            </dl>
          </div>

          {/* System Info */}
          <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6">
            <SectionHeading>システム情報</SectionHeading>
            <dl className="space-y-3">
              <FieldDisplay label="ID (UUID)">
                <span className="font-mono text-xs break-all">{work.id}</span>
              </FieldDisplay>
              <FieldDisplay label="Slug">
                <span className="font-mono">{work.slug}</span>
              </FieldDisplay>
              <FieldDisplay label="Composer ID">
                <span className="font-mono text-xs break-all">{work.composerId}</span>
              </FieldDisplay>
              <FieldDisplay label="Composer Slug">
                <span className="font-mono">{work.composerSlug}</span>
              </FieldDisplay>
            </dl>
          </div>
        </div>
      </div>
    ),
  };

  // --- Tab: Related Phrases (Placeholder) ---
  const phrasesTab: TabItem = {
    id: 'phrases',
    label: '関連フレーズ',
    content: (
      <div className="bg-admin-card-bg rounded-lg border border-admin-border p-8 text-center">
        <p className="text-admin-text-secondary italic">
          フレーズ機能は現在開発中のため、このセクションは将来のリリースで利用可能になります。
        </p>
      </div>
    ),
  };

  const tabs: TabItem[] = [basicInfoTab, phrasesTab];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBackToList}
        className="inline-flex items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary transition-colors group"
      >
        <ArrowLeftIcon />
        <span className="group-hover:underline">作品一覧に戻る</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <nav className="text-xs text-admin-text-secondary mb-1">
            管理画面 / 作品管理 / <span className="text-admin-primary">{displayTitle}</span>
          </nav>
          <h1 className="text-2xl font-bold text-admin-text-primary">
            {isEditing ? `作品を編集: ${displayTitle}` : displayTitle}
            {!isEditing && <UntranslatedBadge shown={isUntranslated} />}
          </h1>
          {!isEditing && (
            <>
              <p className="text-sm text-admin-text-secondary mt-0.5">{work.composerName}</p>
              <p className="text-xs text-admin-text-secondary/70 font-mono mt-1">{work.slug}</p>
            </>
          )}
        </div>
        <div className="flex gap-3 pt-1">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary-hover transition-colors shadow-md shadow-admin-primary/20"
            >
              編集
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <WorkEditForm work={work} onCancel={() => setIsEditing(false)} />
      ) : (
        <Tabs tabs={tabs} />
      )}
    </div>
  );
}
