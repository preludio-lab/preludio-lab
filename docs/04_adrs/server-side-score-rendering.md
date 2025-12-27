# Architecture Decision: Server-Side Score Rendering & Asset Delivery (v5)

## 1. 変更点 (Changelog)
- **Previous:** Client-Side Rendering (CSR) using `abcjs` in the browser.
- **Current:** **Server-Side Generation (SSG)** of Score SVGs + **Cloudflare R2 Delivery.**
- **Reason:** To eliminate client-side rendering latency, reduce device load (battery/CPU), and ensure consistent visual quality across all devices.

---

## 2. 課題: Client-Side Renderingの限界
`abcjs` をクライアントで実行する場合、以下の問題があります。
1.  **Layout Shift:** 描画までの数ミリ秒〜数百ミリ秒の「ガタつき」が発生する (CLS悪化)。
2.  **Performance:** モバイルデバイスで大量の譜面を描画するとCPU負荷が高い。
3.  **Consistency:** フォントやブラウザ差異により、表示が微妙に崩れるリスク。

---

## 3. 推奨アーキテクチャ: Pre-rendered Score Strategy

### 3.1 Rendering Logic (Dual-Format Support)
Admin UIでの保存時（または非同期ジョブ）に、Node.js上でレンダリングエンジンを実行し、SVG文字列を生成します。

1.  **Format Switch:**
    - **ABC:** `abcjs` を使用してレンダリング。
    - **MusicXML:** **Verovio** (WASM/Node.js) を使用。
        - **Reason:** OSMDと比較して、サーバーサイドでの動作が軽量（DOM不要）であり、かつ「浄書（Engraving）」の品質が学術レベルで非常に高いため。
2.  **Process:** Text Data -> Render Engine -> Optimize SVG.
3.  **Output:** Static SVG File.
3.  **Output:** Static SVG File.

### 3.2 Delivery Strategy (Cloudflare R2)
生成されたSVGおよびその他の画像アセットは、**Cloudflare R2** に配置します。

- **Storage:** Cloudflare R2 (Zero Egress Fees).
- **CDN:** Cloudflare Global Edge Network.
- **URL Pattern:** `https://assets.preludio.io/scores/{work_id}/{score_id}.svg`

### 3.3 Hybrid Implementation
インタラクティブ機能（再生カーソル連動など）はどうするか？

- **Static View:** デフォルト表示は **SVG画像 (`<img>`)**。爆速で表示され、CLSもゼロ。
- **Interactive:** 「再生」ボタン押下時、またはユーザーアクション時に初めて `abcjs` のメタデータ（音符座標位置など）をHydrateする、または `SVG` 自体を操作する軽量JSを実行する。

---

## 4. 結論
**Server-Side Rendering + R2 Delivery** を採用します。
これにより、「瞬時の表示」と「高いUX」を両立します。
