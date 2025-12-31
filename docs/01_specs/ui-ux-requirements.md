# UI/UX Requirements Definition (v1.0)

## 1. Design Philosophy

**"Timeless & Modern"**
クラシック音楽の普遍的な美しさを尊重しつつ、現代のWeb技術による機能美を追求する。

- **Content First:** 楽譜と解説テキストが主役。装飾はノイズにならないよう最小限に留める。
- **Academic but Accessible:** 専門的な信頼感（アカデミック）と、初心者への親しみやすさ（アクセシビリティ）を両立する。
- **Motion with Meaning:** アニメーションは「文脈の理解」を助ける場合（例：再生位置のハイライト）にのみ使用し、過度な演出は避ける。

## 2. Design System (Tokens)

### [REQ-UI-001] Color Palette (REQ-UI-COLOR)

- **[REQ-UI-001-01] Theme:** ライトモード/ダークモード対応必須。ハイコントラストで読みやすさを重視。
- **[REQ-UI-001-02] Primary:** `Preludio Black` (墨色) - 重厚感のある黒。
- **[REQ-UI-001-03] Background:** `Paper White` (生成り色) - 楽譜の紙のような、目に優しい白。
- **[REQ-UI-001-04] Accent:** `Classic Gold` - リンクや重要アクションに使用。彩度を抑えた上品な金色。
- **[REQ-UI-001-05] Semantic:** Error (Red), Success (Green) は色覚多様性に配慮した色味を選定する。

### [REQ-UI-002] Typography (REQ-UI-TYPO)

- **[REQ-UI-002-01] Headings:** Serif (e.g., _Noto Serif_, _Playfair Display_) - 格調高さの表現。
- **[REQ-UI-002-02] Body:** Sans-Serif (e.g., _Inter_, _Noto Sans_) - 長文の読みやすさとスクリーンでの可読性重視。
- **[REQ-UI-002-03] Score Text:** ABC記法や歌詞には等幅フォントまたは専用フォントを使用。
- **[REQ-UI-002-04] Vertical Rhythm:** ベースライングリッド（例: 4px/8px）を意識し、行間（Line Height）とマージンをシステム化することで、長文でも疲れない「リズム」を作る。
- **[REQ-UI-002-05] Measure:** 1行の文字数を全角35-40文字（英数70-80文字）程度に抑え、視線移動の負荷を軽減する。

### [REQ-UI-SYS] Design System Architecture

- **[REQ-UI-SYS-001] Spacing:** 4pxまたは8pxの倍数（4, 8, 16, 24, 32, 48, 64px...）で余白を統一し、レイアウトに秩序を持たせる。
- **[REQ-UI-SYS-002] Border Radius:** カードやボタンの角丸を統一（例: 4px, 8px, Pill）し、親しみやすさと知的さを制御する。
- **[REQ-UI-SYS-003] Elevation (Depth):** フラットデザインをベースとしつつ、プレイヤーやドロップダウン等の「浮きがある要素」には、繊細なシャドウ（Glassmorphism等）を用いて階層関係を直感的に伝える。

## 3. Core Component UX

### [REQ-UI-003] Score Renderer (楽譜表示)

- **Responsive Layout:**
  - **[REQ-UI-003-01] Desktop:** 記事本文の横（2カラム）または中央配置。十分な幅を確保し、頻繁な折り返しを防ぐ。
  - **[REQ-UI-003-02] Mobile:**
    - **Reflow Mode:** 画面幅に合わせて小節を自動で折り返す（縦に長くなるが、スクロールだけで読める）。
    - **Scroll Mode (Optional):** 横スクロールで譜面を閲覧できるモード（譜めくりの感覚）。
- **[REQ-UI-003-03] Sync Highlight:** 再生中の小節や音符をリアルタイムでハイライト表示する視覚的フィードバック。
  - **Auto Scroll:** ハイライト位置に合わせて譜面を自動スクロールさせる（ON/OFF切替可）。

### [REQ-UI-004] Audio Player (再生機能)

- **[REQ-UI-004-01] Mobile-First Controls:**
  - **Thumb Zone:** 再生/停止、スキップ等の主要ボタンは、画面下部の「親指が届く範囲」に配置し、タップエリアを48px以上に確保する。
  - **Gestures:** ダブルタップによる「10秒スキップ/巻き戻し」や、スワイプによるプレイヤー格納など、直感的なジェスチャー操作をサポートする。
- **[REQ-UI-004-02] Player Modes:**
  - **Mini Player:**
    - **Default State:** 初期状態では非表示。
    - **Active State:** ユーザーが再生を開始した時点で画面下部にスライドインし、以降はページ遷移しても常駐する。
    - **Interaction:** 再生/一時停止、Focus Modeへの展開ボタンのみを表示する。
  - **Focus Mode (Expanded):** ジャケット写真、詳細なシークバー、トラックリストを表示する全画面モード。没入感を高める。
- **[REQ-UI-004-03] Seamless State:** ページ遷移しても再生が途切れない（Mini Playerの状態を維持する）。実装は Layout レベルで行う。
- **[REQ-UI-004-04] Contextual Sync:** 楽譜上の小節や解説テキストをクリック/タップすると、即座にその位置から再生を開始する。「読んでいる場所を聴く」体験を最優先する。
- **[REQ-UI-004-05] Precision Seeking:** プログレスバー（シークバー）は指で操作しやすい太さを確保し、ドラッグ中はプレビュー時間や拡大波形を表示する（Optional）など、細かい位置指定を容易にする。

### [REQ-UI-005] Navigation & Discovery

- **[REQ-UI-005-01] Global Navigation:**
  - **Language Switcher:** 1クリックで即座に言語を切り替えるドロップダウンまたはボタン（詳細は`REQ-BIZ-GOAL-003`参照）。
  - **Search:** 全文検索へのアクセス。
- **[REQ-UI-005-02] Table of Contents:** 長文記事のための目次をサイドバーまたは上部に固定表示。
- **[REQ-UI-005-03] Series Navigation:** シリーズ記事の場合、「前へ」「次へ」および「シリーズ目次」への導線を明示する。
- **[REQ-UI-005-04] Hero Visual:** 記事トップに大きなサムネイル画像（Hero Image）と、重要メタデータ（作曲家、難易度）を配置し、視覚的な第一印象を強化する（`REQ-CONT-SCHEMA`対応）。

### [REQ-UI-006] Utilities & Compliance

- **[REQ-UI-006-01] Loading State (Skeleton):** 楽譜描画などの重い処理中は、スピナーではなく「スケルトンスクリーン」を表示し、体感速度を向上させる（`REQ-NFR-002-03`対応）。
- **[REQ-UI-006-02] Privacy Consent:** 初回訪問時、GDPR準拠のCookie同意バナーを表示し、同意されるまでYouTube等のサードパーティスクリプトをブロックする（`REQ-TECH-STACK-014`対応）。

### [REQ-UI-INT] Interaction Design

- **[REQ-UI-INT-001] Micro-interactions:** ボタンのHover、Focus、Click時に、わずかなスケール変更や色変化のアニメーション（200ms程度）を付与し、「触れている感覚」を提供する。
- **[REQ-UI-INT-002] Transitions:** ページ遷移やモーダル開閉時に、フェードやスライドといった物理法則に基づいた自然なトランジション（Ease-out等）を適用する。唐突な画面切り替えは避ける。
- **[REQ-UI-INT-003] Social Sharing:**
  - **Share Bar:** 記事読了後、またはスクロール追従型の「シェアボタン（X, Facebook, Copy Link）」を配置する。
  - **Click-to-Tweet:** 記事内の名言や要約など、引用価値の高いテキストを選択・シェアしやすくするUIを提供する。

## 4. Accessibility (A11y)

**Target:** WCAG 2.1 Level AA 準拠を目指す。

### [REQ-UI-007] Keyboard & A11y Support

- **[REQ-UI-007-01] Keyboard Support:** 全てのインタラクションがキーボードのみで操作可能であること。
- **[REQ-UI-007-02] Screen Reader:** 楽譜データ（ABC）は読み上げられない可能性があるため、代替テキスト（Alt）や構造化データによる解説を提供すること。

## 5. AI Design Process (AI-First Workflow)

人間のデザイナーを雇用せず、AIエージェントによる自動生成とコードベースのデザイン管理で品質を担保する。

### [REQ-UI-PROCESS-001] AI-First Design Workflow

- **[REQ-UI-PROCESS-001-01] Concept & Inspiration:** 人間（Producer）がムードボードやキーワード（例: "Timeless & Modern", "Swiss Style"）を定義し、AIエージェントがそれを具体的なカラースキームやフォントの組み合わせ（Tokens）に変換する。
- **[REQ-UI-PROCESS-001-02] Component Generation:** `Designer Agent` がデザインシステムに基づき、Reactコンポーネント（Tailwind CSS）を直接生成する。Figma等のデザインツールは「思考の補助」としてのみ使用し、**正としてのデザインデータ（Master）はコード（Github）に置く。**

### [REQ-UI-PROCESS-002] Design System as Code

- **[REQ-UI-PROCESS-002-01] Token Management:** 色、スペース、タイポグラフィの定義はすべて `tailwind.config.ts` または CSS Variables として管理し、AIがこれを参照して実装を行う。
- **[REQ-UI-PROCESS-002-02] Visual Regression Testing:** デザイン崩れの検知は、人間（Producer）の目視確認に加え、AIによるスナップショット比較（VRT）によって自動化する。
