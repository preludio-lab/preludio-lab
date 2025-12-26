import * as abcjs from 'abcjs';
import { IScoreRenderer, Score, ScoreFormat } from '@/domain/score/Score';

/**
 * AbcjsScoreRenderer
 * IScoreRenderer の 'abcjs' ライブラリを使用したインフラストラクチャ実装です。
 */
export class AbcjsScoreRenderer implements IScoreRenderer {
    /**
     * 指定された要素にスコアをレンダリングします。
     */
    async render(score: Score, element: HTMLElement): Promise<void> {
        if (score.format !== ScoreFormat.ABC) {
            console.warn(`AbcjsScoreRenderer: Unsupported format '${score.format}'. Skipping render.`);
            return;
        }

        if (!element) {
            console.error('AbcjsScoreRenderer: Target element is null.');
            return;
        }

        try {
            // レスポンシブレイアウト用のレンダリングオプション (ドメインからカプセル化)
            const renderOptions: abcjs.AbcVisualParams = {
                responsive: 'resize', // ウィンドウ変更時に自動サイズ調整
                add_classes: true,    // スタイリング用に要素へクラスを追加
                paddingtop: 20,
                paddingbottom: 20,
                paddingleft: 0,
                paddingright: 0,
                // staffwidth は 'responsive: resize' により自動計算されます
            };

            // メタデータでカスタムタイトルが提供されている場合、それを注入または処理したい場合があります。
            // 現状では、abcjs は ABC 文字列からタイトルをレンダリングします。
            // 上書きしたい場合は、ABC 文字列を操作するか、visual options を使用する必要があります。
            // 現在の要件では、与えられたものをそのままレンダリングすることを意味しています。

            abcjs.renderAbc(element, score.data, renderOptions);

        } catch (error) {
            // UI層/コントローラーが処理 (例: トースト表示) できるように再スローします。
            // インフラ層なので、ここでの例外捕捉はデバッグに有用ですが、失敗したことは上位層に知らせるべきです。
            // "handleClientError" はUIでよく使用されるユーティリティです。
            // ここでは標準的なエラー、または単純な Error をスローすることにします。
            throw new Error(`Failed to render ABC score: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
