# 楽曲ソースの決定論的取得アーキテクチャ (Score Retrieval Architecture)

## 1. 背景と目的 (Background & Goals)

現在、本プロジェクトでは IMSLP や KernScores などの外部データソースから楽曲（MusicXML, Humdrum 等）を取得する仕組みを構築しています。従来の動的な CGI スクレイピングやディレクトリ探索には、以下の致命的な脆弱性がありました。

- **非決定性**: 外部サイトの構造変更やデータ削除により、URL が動的に変わりリンク切れが発生する。
- **パフォーマンス負荷**: 実行時に外部サイトへ都度アクセスして探索するため、処理が重く不安定。
- **単一障害点 (SPOF)**: 特定のプロバイダ一箇所にデータがない場合、システム全体がブロックされる。

これらの課題を解決し、**「Zero-Cost Architecture」**（実行時の動的探索コストをゼロにし、不変のデータソースのみを参照する）を実現するため、新しいアーキテクチャへ移行します。

---

## 2. 検討プロセスと学び (Process & Learnings)

本システムの設計過程で得られた重要な知見を、ADR（Architecture Decision Record）の形式で残します。

### 経緯 1: メタ・リポジトリ方式の試行

初期案として、KernScores 全体を管理する `humdrum-tools/humdrum-data` を Git Submodule として取り込む案を検討しました。

- **学び**: このリポジトリはインデックスとしての役割は優秀ですが、**「最新の LIST.txt に掲載されていない楽曲（例: 協奏曲 K. 466）」**の所在を特定することが極めて困難であることが分かりました。また、リポジトリ自体の容量が巨大化するリスクもありました。

### 経緯 2: K. 466 探索から得られた「単一ソースの限界」

当初のターゲットであった Mozart K. 466 は、パブリックな Humdrum エコシステムに存在しない（あるいは所在不明）ことが判明しました。

- **重要教訓**: 特定のデータ形式（Humdrum）や特定のプロバイダ（KernScores）に依存したアーキテクチャでは、10,000曲規模の網羅性は達成できない。「マルチソース化」が必須要件となりました。

### 経緯 3: ストラテジーの転換（Manifest-Driven への移行）

有識者からのアドバイスを受け、「自動探索」から**「正解台帳（マニフェスト）先行型」**へと方針を転換しました。

- **決定**: 「どこに何があるか」を人間（または AI）が事前に調査し、不変の URL を YAML に記述。これを DB へ流し込むパイプラインを先行して構築することで、開発の不確実性を排除します。

---

## 3. 設計指針 (Design Principles)

### 3.1 決定論的取得と不変性 (Immutability)

取得 URL には、リポジトリの特定のブランチ名（`main` 等）ではなく、**40文字のフルコミットハッシュ**を必須とします。これにより、外部リポジトリの更新やブランチ削除によるリンク切れ（Broken Link）を永久に防止します。

- `https://raw.githubusercontent.com/{owner}/{repo}/{hash}/{path}`

**運用ポリシー (Scan & Lock)**: 定期的なスキャン（Scan & Lock）により、最新の安定したコミットハッシュへ一括更新し、マニフェストを「ロック」するメンテナンスフローを想定します。

### 3.2 マルチソース・マルチフォーマット対応

単一のリポジトリ構造に依存せず、以下の要素をマニフェストで吸収します。

- **形式 (Format)**: `.krn`, `.xml`, `.mxl`, `.mei`
- **プロバイダ (Provider)**: `humdrum-data`, `openscore`, `musedata`, `imslp-raw` 等

### 3.3 SSOT (Single Source of Truth) の流向

1.  **data/score-manifest.yaml** (正解データ正本、Git 管理)
2.  **Turso Database** (検索・表示用メタデータ、同期)
3.  **Application (Fetcher)** (DB の情報を元に GitHub から直接 Fetch)

---

## 4. 実装要件 (Implementation Requirements)

### 4.1 マニフェスト形式 (`data/score-manifest.yaml`)

```yaml
- work_slug: piano-sonata-no-11-k331
  provider: humdrum-data
  repository: https://github.com/humdrum-tools/mozart-piano-sonatas
  commit_hash: 'a1b2c3d4e5f6g7h8i9j0...' # 40文字必須
  path: 'kern/sonata11-1.krn'
  format: krn
  license: 'CC-BY-SA 4.0' # 権利表記の自動化のため追加
```

### 4.2 DB 構成 (`score_sources` テーブル)

マルチソースを管理するための専用テーブルを新設します。

- `id`: PK (UUID v7)
- `score_id`: FK to `scores.id`
- `provider`: プロバイダ識別子
- `repository_url`: リポジトリのベースURL
- `commit_hash`: 取得時のコミットハッシュ
- `file_path`: リポジトリ内パス
- `format`: フォーマット種別 (krn, xml, mxl)
- `raw_url`: 生成された https://raw... URL
- `license`: ライセンス識別子 (CC-BY, Public Domain 等)

### 4.3 同期スクリプト (`sync-score-manifest.ts`)

- YAML の内容を Turso へ Upsert する。
- **ID解決**: `work_slug` に基づいて `works` テーブルから UUID (`work_id`) を解決して紐付けを行う。
- 実行時に生成した URL に対して HEAD リクエストを送り、実在を確認するバリデーション機能を備える。
  - **形式検証**: Content-Type をチェックし、圧縮バイナリ (.mxl) の場合は取得後に解凍処理 (Unzip) が必要であることを考慮した設計とする。

---

## 5. ロードマップ (Roadmap)

1. **Phase 1 (Sync)**: マニフェスト形式を確定し、K. 331 / K. 545 を対象とした DB 同期を完遂。
2. **Phase 2 (Fetch)**: マルチフォーマット対応の GitHub Fetcher 実装。
3. **Phase 3 (Expand)**: OpenScore 等の MusicXML データソースを追加し、K. 466 を含む欠落楽曲を補完。
