# Audio Player Feature Design Specification

**Ref:** `REQ-TECH-AUDIO` (technology-requirements.md) / `REQ-UI-004` (ui-ux-requirements.md)

## 1. Overview

Preludio Labにおける「Audio Player」は、ユーザーが楽譜を閲覧しながら直感的に演奏を確認できる学習支援機能です。
ページ遷移しても再生が途切れない「Persistent Player（常駐型プレイヤー）」として設計されています。

**Design Goal:**
`ScoreRenderer` や `MiniPlayer` から、オーディオ再生機能（YouTube IFrame API等）を分離し、**Clean Architecture** に基づいた「機能コンポーネント (Feature Component)」として再構築することを目的としています。
これにより、将来的な「異なるオーディオソース（MP3, SoundCloudなど）」への対応や、「再生制御ロジックのみのテスト」を容易にします。

## 2. User Interaction & UX

ユーザー視点での操作フローと挙動の定義。

### 2.1. 再生開始 (Entry Points)

ユーザーは以下のいずれかのアクションで再生を開始できます。

1.  **楽曲ページ上の再生ボタン:** 記事ヘッダーや、楽譜の特定箇所にある「Play」ボタンをクリック。
    - _Behavior:_ プレイヤーが非表示の場合は `Mini Mode` で下部に出現し、即座に再生を開始します。

### 2.2. プレイヤーの操作 (Controls)

- **Mini Player (常駐モード):**
  - **再生/一時停止:** 中央のボタンでトグル操作。
  - **拡大:** バー領域全体（またはExpandボタン）をクリックすると `Focus Mode` へ遷移。
  - **表示情報:** 曲名、作曲者名 (Composer)、演奏者名 (Performer)、簡易プログレスバー。
- **Focus Player (全画面モード):**
  - **シーク:** プログレスバーをドラッグして任意の位置へ移動。
  - **最小化:** 「⌄」ボタンで `Mini Mode` へ戻る（再生は継続）。
  - **表示情報:** 大きなジャケット画像、詳細なタイムスタンプ。

### 2.3. ページ遷移時の挙動 (Persistence)

- **シームレスな再生:** ユーザーがサイト内を回遊（例: 楽曲ページ → トップページ → Aboutページ）しても、プレイヤーは途切れずに再生を続けます。
- **状態維持:** プレイヤーのモード（Mini/Focus）や音量は、ページ遷移後も保持されます。
- **例外（言語切り替え）:** 言語コンテキスト（`en` ⇔ `ja`）を跨ぐ遷移が行われた場合、プレイヤーの状態はリセットされます。これは、メタデータ（曲名など）の言語一貫性を保ち、アーキテクチャ上の責務分離（言語ごとのLayout再構築）に従うための仕様です。

## 3. Architecture Pattern (Headless UI & Wrapper)

実装とUIを完全に分離するため、**Headless UI** パターンと **Wrapper Pattern** を採用しています。

### 3.1. Clean Architecture & Component Separation

実装の保守性とテスト容易性を高めるため、**Clean Architecture** の原則に基づき、以下の3層構造に分離しています。

```mermaid
graph TD
    subgraph UI_Layer [UI Layer]
        Context[AudioPlayerContext<br>(Global State)]
        Mini[MiniPlayer<br>(Footer UI)]
        Focus[FocusPlayer<br>(Fullscreen UI)]
    end

    subgraph Feature_Layer [Feature Layer]
        Container[GlobalAudioPlayer<br>(Smart Component)]
        Player[AudioPlayer<br>(Dumb Component)]
    end

    subgraph Infrastructure [Infrastructure]
        Lib[react-youtube]
        API[YouTube IFrame API]
    end

    %% Flow
    Context <-->|Sync State| Mini
    Context <-->|Sync State| Focus
    Context <-->|Control / Events| Container

    Container -->|Props| Player
    Player -->|Events| Container
    Player --> Lib
    Lib --> API
```

### 3.2. Wrapper Pattern (SSR Guard)

`react-youtube` などの外部ライブラリは `window` オブジェクトに依存するため、そのままServer Componentで使用するとビルドエラーになります。
これを防ぐため、`GlobalAudioPlayer` の呼び出し元 (`ClientWrapper`) で `next/dynamic` (`ssr: false`) を使用し、クライアントサイドでの実行を保証しています。

### 3.3. **Strict Lazy Loading (LCP Optimization)**

YouTubeなどの外部プレイヤー（Iframe）は初期化コストが高く、ページの初期表示性能（LCP）を著しく低下させる要因となります。
本フューチャーでは、「ユーザーが明確な再生意思を示すまで、Heavy Player（YouTubeAdapter等）をマウントしない」戦略を採用しています。

- **Implementation:** `AudioPlayerAdapter` 内で `hasStarted` ステートを持ち、`isPlaying` が一度も `true` になっていない間は、何もレンダリングしません（`null` を返す）。
- **Trigger:** ユーザーが再生ボタンを押すと、`GlobalAudioPlayer` が `isPlaying: true` を発行し、Adapterが初めて実際のプレイヤーコンポーネントをロードします。
- **Result:** これにより、初期ロード時のネットワークペイロードを数MB単位で削減し、LCPを劇的に改善します。

## 4. State Management (AudioPlayerContext)

アプリケーション全体で単一の「再生状態」を共有します。

| State            | Type                            | Description                                                         |
| :--------------- | :------------------------------ | :------------------------------------------------------------------ | ----------------------------------- |
| `isPlaying`      | `boolean`                       | 再生中か否か。Contextが真の値を持ち、Player実体はこれに追従します。 |
| `videoId`        | `string                         | null`                                                               | 現在ロードされているYouTube動画ID。 |
| `currentTime`    | `number`                        | 現在の再生位置（秒）。Playerからポーリングで更新されます。          |
| `duration`       | `number`                        | 動画の総再生時間（秒）。                                            |
| `mode`           | `'hidden' \| 'mini' \| 'focus'` | プレイヤーの表示モード。                                            |
| `volume`         | `number`                        | 音量 (0-100)。                                                      |
| `videoTitle`     | `string \| null`                | 曲名。                                                              |
| `videoComposer`  | `string \| null`                | 作曲者名。                                                          |
| `videoPerformer` | `string \| null`                | 演奏者名。                                                          |
| `artworkSrc`     | `string \| null`                | アートワーク画像URL。                                               |
| `platformUrl`    | `string \| null`                | プラットフォーム（外部サイト）へのURL。                             |
| `platformLabel`  | `string \| null`                | リンクの表示ラベル (例: "Watch on YouTube")。                       |
| `platformLabel`  | `string \| null`                | リンクの表示ラベル (例: "Watch on YouTube")。                       |
| `platformType`   | `'youtube' \| 'default'`        | アイコン種別識別子。                                                |

### 4.1. Data Structures (Score Integration)

楽譜コンポーネント (`ScoreClientWrapper`) やその他UIから再生を開始する際に渡すべきメタデータ構造は以下の通りです。

```typescript
interface AudioMetadata {
  videoId: string; // YouTube Video ID (Required)
  title?: string; // 曲名 (Optional, default: "Audio Recording")
  composer?: string; // 作曲者名 (Optional, e.g. "J.S. Bach")
  performer?: string; // 演奏者名 (Optional, e.g. "Glenn Gould")
  artworkSrc?: string; // アートワーク画像URL (Optional)
  platformUrl?: string; // 出典URL (Optional, default: YouTube Watch URL)
  platformLabel?: string; // 出典ラベル (Optional, default: "Watch on YouTube")
  platformType?: 'youtube' | 'default'; // アイコン種別 (Optional, default: 'youtube')
  startTime?: number; // 再生開始位置 秒 (Optional)
  endTime?: number; // 再生終了位置 秒 (Optional)
}
```

## 5. Component Specifications

### 5.1. AudioPlayer Feature (`src/components/features/player/`)

#### A. `AudioPlayer` (Dumb Component)

- **Role:** 特定のプラットフォーム（YouTube等）をラップし、統一されたインターフェースを提供する純粋なUIコンポーネント。
- **Props:**
  - `src`: 動画IDまたはURL。
  - `isPlaying`: 再生状態（boolean）。
  - `volume`: 音量 (0-100)。
  - `seekTo`: シーク命令（timestamp）。
  - `onReady`, `onProgress`, `onEnded`, `onError`: イベントハンドラ。
- **Implementation:**
  - `react-youtube` を内部で使用。
  - `useEffect` で props (`isPlaying`, `seekTo`) の変化を監視し、命令的にAPIを操作する。

#### B. `GlobalAudioPlayer` (Smart Component / Container)

- **Role:** `AudioPlayerContext` と `AudioPlayer` の仲介役（Connector）。以前の `YouTubePlayerRenderer` に相当。
- **Responsibilities:**
  - Contextから状態 (`videoId`, `isPlaying` 等) を取得し、`AudioPlayer` にPropsとして渡す。
  - `AudioPlayer` からのイベントを受け取り、Contextの状態を更新する。
  - **Error Handling:** 再生エラーを捕捉し、ユーザーへの通知（Toast）と監視システム（Sentry）への報告を行う。
- **Reliability Strategy (Manual Load):**
  - 自動再生（AutoPlay）に依存せず、Contextの状態遷移に基づいて明示的にロード制御を行うことで、競合状態を防ぐ。

#### C. Integration with Other Components (e.g., Score, Images)

他のコンポーネント（楽譜、画像など）は、直接 `AudioPlayer` を操作するのではなく、**`AudioPlayerContext` を介して** 再生をリクエストします。

- **Action Flow:**
  1.  **Trigger:** ユーザーが楽譜上の「Play」ボタンをクリック。
  2.  **Dispatch:** `ScoreClientWrapper` が `play(metadata)` アクションをコールし、楽曲情報 (`videoId`, `startTime` 等) をContextに送信。
  3.  **State Update:** `AudioPlayerContext` が状態 (`isPlaying: true`, `videoId: ...`) を更新。
  4.  **Reaction:** `GlobalAudioPlayer` が状態変化を検知し、`AudioPlayer` に再生指示を送る。
- **Decoupling:** これにより、楽譜コンポーネントは「どのプレイヤーで再生されるか」を知る必要がなく、純粋に「再生リクエスト」のみに関心を持つことができます。

## 6. Error Handling & Logging Strategy

### 6.1. Error Handling Policy

- **Player Load Failure:** ネットワークエラーや動画削除などで再生できない場合。
  - **Action:** `handleClientError` を呼び出し、Sentryへ通知 + ユーザーにToast ("再生できませんでした") を表示。
  - **Recovery:** プレイヤーの状態を `paused` に戻し、無限ロードや不正な状態を回避する。

### 6.2. Logging (Observability)

重要イベント発生時にログを出力し、デバッグと監視を容易にする。

- **Events:**
  - `PLAYER_READY`: 再生準備完了 (Duration含む)。
  - `PLAYER_ERROR`: エラー発生 (Error Code含む)。

### 5.2. MiniPlayer (`src/components/ui/Player/MiniPlayer.tsx`)

- **Role:** 常駐型の簡易コントローラー。
- **UI Specs:**
  - 画面下部に固定配置 (`fixed bottom-0`)。
  - 再生/停止ボタン、タイトル、進捗プログレスバーを表示。
  - タップ/クリックで `Focus Mode` へ展開。
  - モバイル端末の "Thumb Zone" (親指操作エリア) を意識したレイアウト。

### 5.3. FocusPlayer (`src/components/ui/Player/FocusPlayer.tsx`)

- **Role:** 詳細操作と没入感のための全画面モード。
- **UI Specs:**
  - 画面全体を覆うモーダル (`fixed inset-0`)。
  - シークバー（スライダー）による任意位置へのジャンプ。
  - 「最小化」ボタンで Mini Player に戻る。
  - **Trust & Attribution:** `platformUrl` が存在する場合、そのリンクを表示する。テキストは `platformLabel` (例: "Watch on YouTube") を使用し、アイコンは `platformType` に応じて切り替える。UIはテキストやURLの生成ロジックを持たず、渡されたデータをそのまま表示する。

## 6. Integration (Root Layout)

ページ遷移による再レンダリング（リセット）を防ぐため、`src/app/[lang]/layout.tsx` の最上位レベルに配置されています。このLayoutは同一言語ルート内 (`/[lang]/*`) で永続化されます。

```tsx
<AppProviders>
  {/* ...Header... */}
  <main>{children}</main>
  {/* ...Footer... */}

  {/* Global Persistent Components */}
  <GlobalAudioPlayer />
  <MiniPlayer />
  <FocusPlayer />
</AppProviders>
```

これにより、ユーザーが `/works/bach-prelude` から `/about` へ移動しても、音楽は途切れずに再生され続けます。
