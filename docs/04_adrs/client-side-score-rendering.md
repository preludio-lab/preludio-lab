# Client-Side Score Rendering

Date: 2025-12-15

## Status

Accepted

## Context

音楽コンテンツにおいて「楽譜（画像）」の表示は必須です。
サーバーサイドで画像（PNG/SVG）を生成・保存して配信する方法は、以下の問題があります。
1.  **Storage:** 大量の画像ファイルがストレージ容量（Supabase Free Tier 500MB）を圧迫する。
2.  **Bandwidth:** 画像配信による帯域消費（Vercel 100GB/mo）が増加する。

## Decision

楽譜データは軽量なテキストフォーマットである **ABC記法** で保存・配信し、クライアントブラウザ上で **`abcjs`** ライブラリを用いてSVGレンダリングを行う方式を採用します。

## Consequences

### Positive
*   **Efficiency:** テキストデータのみを転送するため、通信量が極小化される。
*   **Flexibility:** クライアント側で移調（Transpose）やサイズ変更、再生（Audio生成）などのインタラクションが可能になる。

### Negative
*   **CLS Risk:** レンダリング完了まで高さが確定しないため、Layout Shiftが発生しやすい（Skeleton Screen等で対策必須）。
*   **Performance:** クライアント（特に低スペックなモバイル端末）のCPU負荷が増加する。
*   **AI Accuracy:** AIはABC記法の構文エラーや音楽的な不整合（拍数ズレ等）を起こしやすいため、人間によるレビューと描画確認が欠かせない。
*   **Expressiveness:** オーケストラ総譜のような複雑・大規模な楽譜の再現には向かない。主要メロディの抜粋など、簡潔な表現に留める必要がある。
