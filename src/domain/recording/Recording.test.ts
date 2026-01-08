import { describe, it, expect } from 'vitest';
import { Recording } from './Recording';
import { RecordingProvider } from './RecordingSources';

describe('Recording Entity', () => {
    // 制御情報のモック (ID, 楽曲紐付け, タイムスタンプ)
    const mockControl = {
        id: 'rec-1',
        workId: 'work-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // メタデータのモック (演奏者、録音年、推奨フラグ)
    const mockMetadata = {
        performerName: { en: 'Glenn Gould', ja: 'グレン・グールド' },
        recordingYear: 1981,
        isRecommended: true,
    };

    // 音源情報のモック (YouTubeソース)
    const mockSources = {
        items: [
            {
                id: 'src-1',
                provider: RecordingProvider.YOUTUBE,
                sourceId: 'dQw4w9WgXcQ',
            },
        ],
    };

    it('正常に初期化され、便利なショートカットプロパティが動作すること', () => {
        const recording = new Recording({
            control: mockControl,
            metadata: mockMetadata,
            sources: mockSources,
        });

        // 基本プロパティの確認
        expect(recording.id).toBe('rec-1');
        expect(recording.workId).toBe('work-1');
        expect(recording.performerName.en).toBe('Glenn Gould');
        expect(recording.performerName.ja).toBe('グレン・グールド');
        expect(recording.recordingYear).toBe(1981);
        expect(recording.isRecommended).toBe(true);
        expect(recording.sourceItems).toHaveLength(1);
    });

    it('cloneWithメソッドにより、イミュータブルに一部の値を更新できること', () => {
        const recording = new Recording({
            control: mockControl,
            metadata: mockMetadata,
            sources: mockSources,
        });

        // 録音年だけを更新した新しいインスタンスを作成
        const updated = recording.cloneWith({
            metadata: { recordingYear: 1955 },
        });

        // 元のオブジェクトが変更されていないこと (イミュータブル)
        expect(recording.recordingYear).toBe(1981);

        // 更新後のオブジェクトに変更が反映されていること
        expect(updated.recordingYear).toBe(1955);
        // 他のフィールド (演奏者名など) が引き継がれていること
        expect(updated.performerName.en).toBe('Glenn Gould');
        expect(updated.id).toBe('rec-1');
    });
});
