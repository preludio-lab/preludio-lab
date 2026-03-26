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

/**
 * DimensionBar
 * -10 から +10 の値を中央基準のバーチャートで表示する
 */
export function DimensionBar({ dimensionKey, value }: { dimensionKey: string; value: number }) {
  const config = DIMENSION_LABELS[dimensionKey];
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
