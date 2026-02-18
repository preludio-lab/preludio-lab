import { XMLParser, XMLBuilder } from 'fast-xml-parser';

type XMLElement = Record<string, unknown>;

export class MusicXMLOptimizer {
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
      unpairedTags: ['hr', 'br', 'link', 'meta'],
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      preserveOrder: true,
      format: true,
    });
  }

  optimize(
    xmlContent: string,
    options: {
      removePartGroups?: boolean;
      resetPositioning?: boolean;
      alignDynamics?: boolean;
    } = {},
  ): string {
    const jsonObj = this.parser.parse(xmlContent) as XMLElement[];

    // 1. スコア構造の処理
    const score = jsonObj.find((node) => node['score-partwise']);
    if (!score) throw new Error('Invalid MusicXML: score-partwise not found');

    const partwise = score['score-partwise'] as XMLElement[];

    // A. レイアウト関連の初期化要素を削除 (Verovioの自動配置を優先)
    if (options.resetPositioning) {
      for (let i = partwise.length - 1; i >= 0; i--) {
        if (partwise[i]['defaults'] || partwise[i]['credit']) {
          partwise.splice(i, 1);
        }
      }
    }

    // B. 大譜表のブレース処理
    // オプションで削除指示があれば削除、そうでなければ必要に応じて追加
    if (options.removePartGroups) {
      this.removePartGroups(partwise);
    } else {
      // 既存ロジック: 必要ならブレースを追加（主にピアノ譜などで不足している場合）
      // this.applyGrandStaffBraces(partwise); // 一旦既存のまま維持、もしくはここで制御
      this.applyGrandStaffBraces(partwise);
    }

    // B. パート（小節）の処理
    const parts = partwise.filter((node) => node['part']) as XMLElement[];
    parts.forEach((partNode, partIndex) => {
      const measures = partNode['part'] as XMLElement[];

      // 小節の最適化
      this.processMeasures(measures, partIndex, options);
    });

    return this.builder.build(jsonObj);
  }

  private removePartGroups(partwise: XMLElement[]): void {
    const partListIndex = partwise.findIndex((node) => node['part-list']);
    if (partListIndex === -1) return;

    const partList = partwise[partListIndex]['part-list'] as XMLElement[];

    // part-group を削除
    // loop backward to remove elements safely
    for (let i = partList.length - 1; i >= 0; i--) {
      if (partList[i]['part-group']) {
        partList.splice(i, 1);
      }
    }
  }

  private applyGrandStaffBraces(partwise: XMLElement[]): void {
    // Check if part-list exists
    const partListIndex = partwise.findIndex((node) => node['part-list']);
    if (partListIndex === -1) return;

    const partList = partwise[partListIndex]['part-list'] as XMLElement[];

    // 既存の part-group があるかチェック
    const hasGroup = partList.some((node) => node['part-group']);
    if (hasGroup) return; // 既にある場合は何もしない（二重追加防止）

    // part-group start の追加
    const groupStart = {
      'part-group': [
        { 'group-symbol': [{ '#text': 'brace' }] },
        { 'group-barline': [{ '#text': 'yes' }] },
      ],
      ':@': { '@_type': 'start', '@_number': '1' },
    };

    // 最初のscore-partの前に挿入
    const firstPartIndex = partList.findIndex((node) => node['score-part']);
    if (firstPartIndex !== -1) {
      partList.splice(firstPartIndex, 0, groupStart);
    }
  }

  private processMeasures(
    measures: XMLElement[],
    partIndex: number,
    options: { resetPositioning?: boolean; alignDynamics?: boolean },
  ): void {
    measures.forEach((measureNode) => {
      if (!measureNode['measure']) return;
      const measureContent = measureNode['measure'] as XMLElement[];

      // ページレイアウト関連のタグを削除（Verovioの動配置を優先するため）
      if (options.resetPositioning) {
        for (let i = measureContent.length - 1; i >= 0; i--) {
          if (measureContent[i]['print']) {
            measureContent.splice(i, 1);
          }
        }
      }

      // 1. 属性 (Time Signature)
      this.optimizeAttributes(measureContent);

      // 2. 音符 (Tuplets)
      this.optimizeTuplets(measureContent);

      // 3. 指示記号 (テキスト & 強弱記号)
      this.optimizeDirections(measureContent, partIndex, options);

      // 4. 強弱記号の移動 (Align Dynamics)
      if (options.alignDynamics) {
        this.alignDynamicsToNotes(measureContent);
      }

      // 5. テンポ記号の移動 (Align Tempo to Start)
      if (options.resetPositioning) {
        this.alignTempoToStart(measureContent);
      }
    });
  }

  private optimizeAttributes(measureContent: XMLElement[]): void {
    const attributesNode = measureContent.find((n) => n['attributes']);
    if (!attributesNode) return;

    const attributes = attributesNode['attributes'] as XMLElement[];
    const timeNode = attributes.find((n) => n['time']);

    if (timeNode) {
      const time = timeNode['time'] as XMLElement[];
      const beats = (time.find((n) => n['beats']) as XMLElement)?.['beats'] as [
        { '#text': number },
      ];
      const beatType = (time.find((n) => n['beat-type']) as XMLElement)?.['beat-type'] as [
        { '#text': number },
      ];

      if (beats && beatType && beats[0]['#text'] == 2 && beatType[0]['#text'] == 2) {
        if (!timeNode[':@']) timeNode[':@'] = {};
        (timeNode[':@'] as Record<string, string>)['@_symbol'] = 'cut';
      }
    }
  }

  private optimizeTuplets(measureContent: XMLElement[]): void {
    const notes = measureContent.filter((n) => n['note']) as XMLElement[];
    notes.forEach((note) => {
      const content = note['note'] as XMLElement[];
      const notations = content.find((n) => n['notations']);

      if (notations) {
        const nots = notations['notations'] as XMLElement[];
        const tuplet = nots.find((n) => n['tuplet']);
        if (tuplet) {
          if (!tuplet[':@']) tuplet[':@'] = {};
          (tuplet[':@'] as Record<string, string>)['@_bracket'] = 'no';
          (tuplet[':@'] as Record<string, string>)['@_show-number'] = 'none';
        }
      }
    });
  }

  private optimizeDirections(
    measureContent: XMLElement[],
    partIndex: number,
    options: { resetPositioning?: boolean },
  ): void {
    // Loop backward to safely remove directions if they become empty
    for (let i = measureContent.length - 1; i >= 0; i--) {
      const node = measureContent[i];
      if (!node['direction']) continue;

      const dir = node as XMLElement;
      const content = dir['direction'] as XMLElement[];
      const typeIndex = content.findIndex((n) => n['direction-type']);
      if (typeIndex === -1) {
        measureContent.splice(i, 1);
        continue;
      }

      const type = content[typeIndex];
      const dtContent = type['direction-type'] as XMLElement[];

      // Filter out Metronome (Tempo) marks contents
      const metronomeIndex = dtContent.findIndex((n) => n['metronome']);
      if (metronomeIndex !== -1) {
        dtContent.splice(metronomeIndex, 1);
      }

      // Filter dynamics for left hand if needed
      if (partIndex === 1) {
        const dynamicsIndex = dtContent.findIndex((n) => n['dynamics']);
        if (dynamicsIndex !== -1) {
          dtContent.splice(dynamicsIndex, 1);
        }
      }

      // Text style adjustments
      // ... (text adjustments)
      const wordsIndex = dtContent.findIndex((n) => n['words']);
      if (wordsIndex !== -1) {
        const wordsNode = dtContent[wordsIndex]['words'] as XMLElement[];
        const textText = wordsNode[0]['#text'] as string;

        if (textText && textText.includes('Adagio')) {
          const wNode = dtContent[wordsIndex] as XMLElement;
          if (!wNode[':@']) wNode[':@'] = {};
          (wNode[':@'] as Record<string, string>)['@_font-weight'] = 'bold';
          if (!options.resetPositioning) {
            (wNode[':@'] as Record<string, string>)['@_relative-y'] = '35';
          }
        }

        if (textText && textText.includes('Si deve')) {
          const wNode = dtContent[wordsIndex] as XMLElement;
          if (!wNode[':@']) wNode[':@'] = {};
          (wNode[':@'] as Record<string, string>)['@_font-style'] = 'normal';
        }
      }

      // Check if direction-type is effectively empty (filtering out whitespace text)
      const isEmpty = dtContent.every((child) => {
        // If child has keys other than ':@' (attributes) and keys are not empty text, it's content.
        const keys = Object.keys(child).filter((k) => k !== ':@');
        if (keys.length === 0) return true; // Empty object
        if (keys.length === 1 && keys[0] === '#text') {
          const textVal = child['#text'];
          return typeof textVal === 'string' && textVal.trim() === '';
        }
        return false;
      });

      if (isEmpty || dtContent.length === 0) {
        measureContent.splice(i, 1);
        continue;
      }

      // Reset Positioning (Deep cleanup)
      if (options.resetPositioning) {
        // 1. Direction tag
        if (dir[':@']) {
          delete (dir[':@'] as Record<string, string>)['@_default-x'];
          delete (dir[':@'] as Record<string, string>)['@_default-y'];
          delete (dir[':@'] as Record<string, string>)['@_relative-x'];
          delete (dir[':@'] as Record<string, string>)['@_relative-y'];
        }

        // 2. Content tags (words, dynamics, etc.)
        dtContent.forEach((child) => {
          Object.keys(child).forEach((key) => {
            if (key === ':@') return;
            // child[key] is likely an array (fast-xml-parser preserveOrder) but checks needed
            // Actually, 'child' is { 'dynamics': [ { 'ff': [] } ], ':@': attributes }
            // We need to clean attributes on `child` itself if any (e.g. <words default-x...>)
            // In fast-xml-parser preserveOrder:
            // child structure: { tagName: [children], ':@': { attributes } }

            // Remove attributes from the child itself (e.g. <dynamics default-x..>)
            if (child[':@']) {
              delete (child[':@'] as Record<string, string>)['@_default-x'];
              delete (child[':@'] as Record<string, string>)['@_default-y'];
              delete (child[':@'] as Record<string, string>)['@_relative-x'];
              delete (child[':@'] as Record<string, string>)['@_relative-y'];
            }

            // For dynamics, specifically, the 'ff', 'pp' tags are children of 'dynamics'
            // They usually don't have positioning, but good to know.
          });
        });
      }
    }
  }

  private alignDynamicsToNotes(measureContent: XMLElement[]): void {
    // 1. 小節内の最初の非休符音符を探す
    let firstNoteIndex = -1;
    for (let j = 0; j < measureContent.length; j++) {
      if (measureContent[j]['note']) {
        const noteContent = measureContent[j]['note'] as XMLElement[];
        if (!noteContent.some((n) => n['rest'])) {
          firstNoteIndex = j;
          break;
        }
      }
    }

    if (firstNoteIndex === -1) return;

    // 2. その音符より前にある強弱記号をすべてその直前（または同時刻）に寄せる
    // 特に休符の後に置かれている場合、音符の直前に移動させることで音符に紐付ける
    for (let i = 0; i < firstNoteIndex; i++) {
      const node = measureContent[i];
      if (node['direction']) {
        const content = node['direction'] as XMLElement[];
        const type = content.find((n) => n['direction-type']) as unknown as XMLElement;
        if (type) {
          const dtContent = type['direction-type'] as XMLElement[];
          if (dtContent.some((n) => n['dynamics'])) {
            // 移動実行: firstNoteIndex の直前へ
            const [dynamicsNode] = measureContent.splice(i, 1);
            // i が減ったので、firstNoteIndex も減る
            firstNoteIndex--;
            measureContent.splice(firstNoteIndex, 0, dynamicsNode);
            // i は現在の位置にとどまり、次の要素をチェックする
            i--;
          }
        }
      }
    }
  }

  private alignTempoToStart(measureContent: XMLElement[]): void {
    // 小節内の "words" (Allegro等) を探して、小節の先頭（attributesの直後）に移動する
    for (let i = measureContent.length - 1; i >= 0; i--) {
      const node = measureContent[i];
      if (node['direction']) {
        const content = node['direction'] as XMLElement[];
        const type = content.find((n) => n['direction-type']) as unknown as XMLElement;
        if (type) {
          const dtContent = type['direction-type'] as XMLElement[];
          if (dtContent.some((n) => n['words'])) {
            // テンポ指示と思われるものを先頭へ
            const [tempoNode] = measureContent.splice(i, 1);
            // attributes の直後、またはインデックス0に挿入
            let insertIndex = 0;
            const attrIndex = measureContent.findIndex((n) => n['attributes']);
            if (attrIndex !== -1) insertIndex = attrIndex + 1;

            measureContent.splice(insertIndex, 0, tempoNode);
          }
        }
      }
    }
  }
}
