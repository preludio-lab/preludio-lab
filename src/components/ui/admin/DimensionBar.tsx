import React from 'react';

/** 印象次元の表示ラベル定義 (-10 to +10) */
export const DIMENSION_LABELS: Record<
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

/** 作品用の印象評価軸ラベル定義 */
export const WORK_DIMENSION_LABELS: Record<
  string,
  { label: string; negativeLabel: string; positiveLabel: string }
> = {
  brightness: { label: '明るさ', negativeLabel: '暗鬱・重厚', positiveLabel: '明朗・輝き' },
  vibrancy: { label: '躍動感', negativeLabel: '静寂・停滞', positiveLabel: '躍動・爆発' },
  scale: { label: 'スケール', negativeLabel: '親密・個人', positiveLabel: '壮大・宇宙' },
  depth: { label: '聴きごたえ', negativeLabel: '軽快・BGM', positiveLabel: '深遠・哲学' },
  drama: { label: 'ドラマ性', negativeLabel: '純音楽・抽象', positiveLabel: '劇的・物語' },
  popularity: { label: '知名度', negativeLabel: '通好み・ニッチ', positiveLabel: '世界的定番' },
};

/**
 * DimensionBar
 * -10 から +10 の値を中央基準のバーチャートで表示する
 */
export function DimensionBar({
  dimensionKey,
  value,
  labels = DIMENSION_LABELS,
}: {
  dimensionKey: string;
  value: number;
  labels?: typeof DIMENSION_LABELS;
}) {
  const config = labels[dimensionKey];
  if (!config) return null;

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
