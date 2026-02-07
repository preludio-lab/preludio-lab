'use client';

import React from 'react';
import { Badge } from '@/components/ui/admin/CommonIcons';

interface PhraseEditorProps {
  phrase: {
    id: string;
    title: string;
    workTitle: string;
    composerName: string;
    measureRange: string;
    svgUrl: string;
    status: 'published' | 'draft';
  };
}

/**
 * PhraseEditor - フレーズエディタ (Presentational Component)
 * Figma v2 Spec: MusicXMLレンダリング不要、事前生成SVGプレビュー対応
 */
export function PhraseEditor({ phrase }: PhraseEditorProps) {
  return (
    <div className="space-y-6">
      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-xs text-admin-text-secondary mb-2">
            管理画面 / フレーズ管理 / <span className="text-admin-primary">{phrase.title}</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-admin-text-primary">{phrase.title}</h1>
            <Badge variant={phrase.status === 'published' ? 'success' : 'warning'}>
              {phrase.status === 'published' ? '公開中' : '下書き'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-admin-border text-admin-text-primary text-sm font-medium rounded-lg hover:bg-admin-sidebar-bg transition-colors">
            プレビュー
          </button>
          <button className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary/90 transition-colors">
            変更を保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メタデータ編集エリア */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-admin-text-primary border-b border-admin-border pb-2 mb-4">
              メタデータ
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary uppercase mb-1">
                  フレーズタイトル
                </label>
                <input
                  type="text"
                  defaultValue={phrase.title}
                  className="w-full px-3 py-2 border border-admin-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-admin-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary uppercase mb-1">
                  作品紐付け
                </label>
                <p className="text-sm font-medium text-admin-primary underline cursor-pointer">
                  {phrase.workTitle}
                </p>
                <p className="text-xs text-admin-text-secondary mt-1">{phrase.composerName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary uppercase mb-1">
                  小節範囲
                </label>
                <input
                  type="text"
                  defaultValue={phrase.measureRange}
                  className="w-full px-3 py-2 border border-admin-border rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-admin-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SVGプレビューエリア */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-admin-border overflow-hidden min-h-[400px] flex flex-col">
            <div className="bg-admin-sidebar-bg px-6 py-3 border-b border-admin-border flex items-center justify-between">
              <span className="text-xs font-semibold text-admin-text-secondary uppercase">
                Score Preview (SVG)
              </span>
              <div className="flex gap-2">
                <button
                  className="p-1.5 hover:bg-admin-border rounded transition-colors"
                  title="Zoom In"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <button
                  className="p-1.5 hover:bg-admin-border rounded transition-colors"
                  title="Zoom Out"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 flex items-center justify-center bg-[#fafafa]">
              {/* SVGプレビューのプレースホルダー */}
              <div className="w-full max-w-2xl aspect-[4/1] bg-admin-sidebar-bg border-2 border-dashed border-admin-border rounded flex flex-col items-center justify-center text-admin-text-secondary grayscale">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="w-12 h-12 mb-2 opacity-20"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
                  />
                </svg>
                <span className="text-sm font-medium">SVG Preview (Music Score)</span>
                <span className="text-xs opacity-60 mt-1">
                  Pre-generated SVG file is loaded here
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
