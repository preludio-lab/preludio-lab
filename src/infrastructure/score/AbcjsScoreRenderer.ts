import * as abcjs from 'abcjs';
import { INotationRenderer, NotationFormat } from '@/domain/score/Score';

/**
 * AbcjsScoreRenderer
 * INotationRenderer の 'abcjs' ライブラリを使用したインフラストラクチャ実装です。
 */
export class AbcjsScoreRenderer implements INotationRenderer {
  /**
   * 指定された要素にスコアをレンダリングします。
   */
  async render(data: string, element: HTMLElement, format: NotationFormat): Promise<void> {
    if (format !== NotationFormat.ABC) {
      console.warn(`AbcjsScoreRenderer: サポートされていないフォーマット '${format}' です。レンダリングをスキップします。`);
      return;
    }

    if (!element) {
      console.error('AbcjsScoreRenderer: ターゲット要素が null です。');
      return;
    }

    try {
      const renderOptions: abcjs.AbcVisualParams = {
        responsive: 'resize',
        add_classes: true,
        paddingtop: 20,
        paddingbottom: 20,
        paddingleft: 0,
        paddingright: 0,
      };

      abcjs.renderAbc(element, data, renderOptions);
    } catch (error) {
      throw new Error(
        `ABCスコアのレンダリングに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
