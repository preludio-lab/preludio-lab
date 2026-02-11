/**
 * Preprocesses MDX content to transform custom notations into standard components.
 *
 * Example: @[images/theme.svg] -> <MusicalExample src="images/theme.svg" />
 */
export function preprocessMdx(content: string): string {
  if (!content) return content;

  // Transform @[path/to/asset] into <MusicalExample src="path/to/asset" />
  // This supports both relative paths in logical colocation structure.
  return content.replace(/@\[([^\]]+)\]/g, (match, src) => {
    return `<MusicalExample src="${src}" />`;
  });
}
