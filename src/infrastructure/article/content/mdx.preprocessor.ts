/**
 * MDXコンテンツを前処理し、独自記法を標準コンポーネントに変換します。
 *
 * 例: @[images/theme.svg] -> <MusicalExample src="images/theme.svg" />
 */
export function preprocessMdx(content: string): string {
  if (!content) return content;

  // @[path/to/asset] を <MusicalExample src="path/to/asset" /> に変換
  // これにより、論理的なコロケーション構造内の相対パスをサポートします。
  return content.replace(/@\[([^\]]+)\]/g, (match, src) => {
    return `<MusicalExample src="${src}" />`;
  });
}
