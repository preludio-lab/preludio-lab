import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface SlicerOptions {
  startMeasure: number;
  endMeasure: number;
}

export function sliceMusicXML(xmlContent: string, options: SlicerOptions): string {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true,
    unpairedTags: ['hr', 'br', 'link', 'meta'],
  });

  const jsonObj = parser.parse(xmlContent) as Record<string, unknown>[];

  // Find score-partwise
  const score = jsonObj.find((node) => node['score-partwise']);
  if (!score) throw new Error('Invalid MusicXML: score-partwise not found');

  const partwise = score['score-partwise'];

  // For each part
  (partwise as Record<string, unknown>[]).forEach((node) => {
    if (node['part']) {
      const part = node['part'];

      // Filter measures
      // Note: preserveOrder mode structure is different
      // In preserveOrder, children are in an array of objects
      const filteredMeasures = (part as Record<string, unknown>[]).filter((child) => {
        if (child['measure']) {
          const measureAttr = child[':@'];
          const measureNum = parseInt(measureAttr?.['@_number'] || '0', 10);
          return measureNum >= options.startMeasure && measureNum <= options.endMeasure;
        }
        return true; // Keep other things like attributes if they exist at part level?
      });

      // Update part children
      node['part'] = filteredMeasures;
    }
  });

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: true,
    format: true,
  });

  return builder.build(jsonObj);
}
