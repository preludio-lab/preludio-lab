# Project Deliverables & Definition of Done

## 1. Purpose (本ドキュメントの目的)

このドキュメントでは、プロジェクトの各フェーズにおける**「成果物（Deliverables/Output）」**と、その**「完了条件（Definition of Done）」**を定義します。

- **機能要件 (Outcome)** の詳細については、`docs/01_specs/` 配下の要件定義書を参照してください。本ドキュメントは、それらの要件が「どの単位で納品・完了とされるか」を管理します。

## 2. 成果物一覧 (Deliverables Matrix)

| Phase    | Category  | Artifact ID        | Description                                       | Source Ref                |
| :------- | :-------- | :----------------- | :------------------------------------------------ | :------------------------ |
| **P0.5** | Guideline | `DEL-GUIDE-SET`    | 開発運用ガイドライン一式 (Guide, Test, Naming)    | `02_guidelines`           |
| **P0.5** | Infra     | `DEL-INFRA-VERCEL` | 本番稼働環境 (Vercel + Domain)                    | `infrastructure_design`   |
| **P0.5** | Infra     | `DEL-INFRA-CI`     | CI/CDパイプライン (GitHub Actions)                | `infrastructure_design`   |
| **P1**   | Core App  | `DEL-CORE-APP`     | アプリケーションシェル (Next.js, Routing, Layout) | `routing-design`          |
| **P1**   | Core App  | `DEL-CORE-SCORE`   | 楽譜レンダリングコンポーネント (ScoreRenderer)    | `ui-ux-requirements`      |
| **P1**   | Core App  | `DEL-CORE-AUDIO`   | 音声プレイヤーコンポーネント (AudioPlayer)        | `ui-ux-requirements`      |
| **P1**   | Core App  | `DEL-CORE-MDX`     | 多言語MDXブログシステム                           | `technology-requirements` |
| **P2**   | Agent     | `DEL-AGENT-MUSIC`  | 音楽学者エージェント (Prompt + Tool Code)         | `agent-design`            |
| **P2**   | Agent     | `DEL-AGENT-TRANS`  | 翻訳エージェント (Prompt + Orchestrator)          | `agent-design`            |
| **P2**   | Content   | `DEL-CONT-PILOT`   | パイロット記事コンテンツ (5本 x 多言語)           | `content-requirements`    |
| **P3**   | Biz       | `DEL-BIZ-SEO`      | SEOアセット (Sitemap, RSS, Robots.txt)            | `business-requirements`   |

## 3. 完了の定義 (Definition of Done)

### コード実装 (Code Implementation)

- [ ] TypeScriptの型エラーがないこと (`Strict: true`)
- [ ] リントエラーがないこと (`ESLint`)
- [ ] ユニットテストが存在し、全てパスしていること (`Vitest`)
- [ ] 関連するドキュメント（JSDoc等）が更新されていること

### 記事コンテンツ (Content Article)

- [ ] 音楽理論的に正しい分析が含まれていること
- [ ] 楽譜（ABC記法）が正しくレンダリングされていること
- [ ] 指定された全言語（EN, ES, FR, DE, IT, ZH）に翻訳されていること
- [ ] OGP画像（SNSシェア時に表示されるサムネイル画像）が設定されていること
- [ ] リンク切れがないこと

### AIエージェント (AI Agent)

- [ ] 指定された入力に対して、期待されるフォーマット（JSON/Markdown）で出力すること
- [ ] エラーハンドリング（API制限、パースエラー）が実装されていること
- [ ] 冪等性（同じ入力ならほぼ同じ結果、または許容範囲内の揺らぎ）が確認されていること
