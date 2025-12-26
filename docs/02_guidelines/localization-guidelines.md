# Localization & Translation Guidelines (v1.0)

## 1. Supported Languages
*   **English (en):** グローバル標準。アメリカ英語 (US) をベースとする。
*   **Spanish (es):** 欧州・中南米向け。汎用的なスペイン語 (Neutral Spanish) を目指す。
*   **Japanese (ja):** 日本国内向け（Source Language）。
*   **German (de):** 音楽用語の正確性を重視（独: Satz, Takt etc.）。
*   **French (fr):** 芸術的な表現を尊重する。
*   **Italian (it):** 音楽用語の故郷として、自然な表現を目指す。
*   **Chinese (zh):** 簡体字 (zh-CN) を採用する。

## 5. AI Translation Policy (Ref: `REQ-GOAL-003-03`)
*   **Automation:** 翻訳プロセスは **100% AIエージェント** により実行される。人間によるレビューは行わない（コスト削減のため）。
*   **Source of Truth:** 日本語 (ja) をマスターとし、他言語への翻訳漏れがないよう管理する。
*   **Feedback Loop:** ユーザーからの誤訳報告があった場合のみ、個別に修正を行う。

## 2. Musical Terminology Policy
音楽用語の翻訳において、専門性と分かりやすさのバランスを定義する。

*   **Original Italian:** 楽語（Allegro, Andante等）は、**イタリック体**で原語（イタリア語）をそのまま使用する。
    *   Example: *"The piece begins with an Allegro tempo."*
*   **Movement:**
    *   EN: "1st Movement", "2nd Movement"
    *   JA: "第1楽章", "第2楽章"
*   **Key Signature:**
    *   EN: "C Major", "C minor"
    *   JA: "ハ長調", "ハ短調" ※ただし本文中では `C Major` のような英語併記も許容する（ジャズ・ポピュラー層への配慮）。

## 3. Tone & Style

### Japanese (JA)
*   **Style:** 「です・ます」調（敬体）を基本とする。親しみやすさを重視。
*   **Person:** 読者への呼びかけは極力避けるが、必要な場合は「あなた」ではなく「私たち（聴き手）」という主語を用いる。

### English (EN)
*   **Style:** Concise & Academic but engaging. Avoid overly flowery Victorian prose.
*   **Person:** "We" or "The listener".

## 4. Proper Nouns (Names & Works)
*   **Rule:** Google Knowledge Graph で最も一般的な表記を採用する。
*   **Database:** 今後整備する `01_specs/dictionaries/composers.json` を正とする。
