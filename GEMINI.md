# PreludioLab: Global Project Mandate

クラシック音楽の深淵に触れる、世界最高の情報プラットフォーム。
単なるデータベースではなく、音楽への没入感と知的発見を提供する「デジタル・ライブラリ」を目指します。

## 1. Vision & Aesthetics (AIの判断基準)

エージェントは UI/UX の提案や実装を行う際、以下のトーン＆マナーを最優先してください。

- **静謐と気品**: 博物館や図書館のような落ち着いたデザイン。過度な装飾や広告的な要素を徹底的に排除する。
- **タイポグラフィ重視**: 音楽の「美」を伝えるため、フォントのレンダリング品質と読みやすさに妥協しない。
- **高解像度な体験**: 高解像度画像と滑らかなモーション（Framer Motion）を活用し、クラシック音楽の芸術性に相応しい没入感を提供する。

## 2. Technical Stack & Architecture

- **Next.js 16 (App Router) / React 19 / TypeScript 5**
- **Tailwind CSS 4 / Framer Motion**
- **Zero-Cost Architecture**: SaaSの無料枠（Vercel, Turso, Supabase, Cloudflare）をフル活用し、個人開発のコストでエンタープライズ品質を実現する。
- **Clean Architecture (Onion)**: 依存方向の厳守と関心事の分離を徹底し、5年以上の長期運用に耐えうる堅牢な設計を維持する。

## 3. Engineering Standards & Lessons (最優先制約)

過去のトラブルや学びに基づく、エージェントが遵守すべき「憲法」です。

- **Next.js Static Analysis First**:
  - `next/font`, `next/image`, `metadata` などのコア機能を扱う際は、ランタイムの JS 実行よりも **ビルド時の静的解析（Static Analysis）の制約** を優先すること。
  - 静的解析を阻害する動的インポートや複雑な条件分岐は避け、必要に応じて定数分離等の「コンパイラに優しい」実装を選択すること。
  - 不明な場合は必ず `pnpm build` による検証を行い、実機での挙動を確認すること。
- **Security & CSP Sync**:
  - 外部リソース（画像、API、iframe等）を追加・変更した際は、必ず `src/proxy.ts` の `cspHeader` と `next.config.ts` の `remotePatterns` を同期させること。
- **Zero-Cost Constraint**:
  - リソース消費（Vercel Execution Time, DB Request, R2 Class B etc.）を最小化するコードを常に選択すること。

## 4. 開発ルールとガイドライン

以下の外部定義を基盤として動作してください。

<!-- Imported from: .agent/rules/engineering-behavior.md -->
<!-- Imported from: .agent/rules/no-emojis.md -->
<!-- Imported from: .agent/rules/language.md -->
<!-- Imported from: docs/02_guidelines/development-guidelines.md -->

## 5. Knowledge Hub (参照先)

- **設計・命名規則**: `docs/02_guidelines/`
- **過去の意思決定記録 (ADR)**: `docs/04_adrs/`
- **コンテンツ生成ルール**: `docs/02_guidelines/ai-content-generation-rules.md`
- **トラブルシューティング**: `docs/06_troubleshooting/`

---

> [!IMPORTANT]
> この `GEMINI.md` は本プロジェクトの最高法規です。エージェントは常にこのビジョンと制約に照らし合わせ、単なる「動くコード」ではなく「PreludioLabに相応しい品質」を追求してください。
