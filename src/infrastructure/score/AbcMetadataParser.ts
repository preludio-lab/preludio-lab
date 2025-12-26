/**
 * AbcMetadataParser
 * ABC記法の文字列からメタデータとディレクティブを解析するインフラストラクチャサービス。
 * ABCテキストフォーマットに関する知識をここにカプセル化します。
 */
export class AbcMetadataParser {
    /**
     * ABCコンテンツからカスタムディレクティブ (%% で始まる行) を解析します。
     * 任意のメタデータを識別するためのキーと値のマップを返します。
     * 
     * Example:
     * %%audio_src v123
     * -> { "audio_src": "v123" }
     */
    public parseDirectives(abcContent: string): Record<string, string> {
        const directives: Record<string, string> = {};
        const lines = abcContent.split('\n');

        lines.forEach(line => {
            const trimmed = line.trim();
            // %% で始まる行をディレクティブとして解析
            if (!trimmed.startsWith('%%')) return;

            // キーの扱いを容易にするため '%%' 接頭辞を削除します。
            // 保持することでディレクティブであることを明確にする選択肢もありますが、
            // ここではキーをクリーンにするために '%%' を削除します: "audio_src"
            const content = trimmed.substring(2);

            // 最初の空白で分割
            const parts = content.split(/\s+/);
            const key = parts[0];
            const value = parts.slice(1).join(' ');

            if (key && value) {
                directives[key] = value;
            }
        });

        return directives;
    }
}
