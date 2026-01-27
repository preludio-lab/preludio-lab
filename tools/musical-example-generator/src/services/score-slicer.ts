import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface SlicerOptions {
  startMeasure?: number;
  endMeasure?: number;
  partId?: string;
  staffNumber?: number;
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

  const partwise = score['score-partwise'] as Record<string, unknown>[];

  // --- Part List Filtering ---
  if (options.partId) {
    const partList = partwise.find((node) => node['part-list']) as Record<string, unknown>[];
    if (partList && partList['part-list']) {
      const partListChildren = partList['part-list'] as Record<string, unknown>[];
      
      const filteredList = partListChildren.filter((child) => {
        if (child['score-part']) {
           const attrs = child[':@'] as Record<string, string>;
           return attrs?.['@_id'] === options.partId;
        }
        return true; // Keep other existing tags like part-group (maybe unsafe if empty group remains, but ok for now)
      });
      
      // Update part-list
      const listIndex = partwise.findIndex((node) => node['part-list']);
      partwise[listIndex]['part-list'] = filteredList;
    }
  }

  // --- Part Data Filtering ---
  const filteredPartwiseContent = partwise.filter((node) => {
    if (node['part']) {
      const partAttrs = node[':@'] as Record<string, string>;
      const pId = partAttrs?.['@_id'];
      
      // Filter by Part ID
      if (options.partId && pId !== options.partId) {
        return false;
      }
      
      // Inside the kept part, filter measures and staves
      const partContent = node['part'] as Record<string, unknown>[];
      
      const filteredMeasures = partContent.filter((child) => {
        if (child['measure']) {
          const measureAttr = child[':@'] as Record<string, string> | undefined;
          const measureNum = parseInt(measureAttr?.['@_number'] || '0', 10);
          
          // Measure Range Filter
          if (options.startMeasure && measureNum < options.startMeasure) return false;
          if (options.endMeasure && measureNum > options.endMeasure) return false;

          // Staff Filtering (within the measure)
          if (options.staffNumber) {
            const measureContent = child['measure'] as Record<string, unknown>[];
            const filteredMeasureContent = measureContent.filter((measureChild) => {
              // 1. Remove <staff> tags not matching (often attached to notes/directions)
              // Actually, notes have <staff> child. Attributes have <clef> with @number.
              
              // Handle <note>, <forward>, <backup>, <direction>
              if (measureChild['note'] || measureChild['direction'] || measureChild['forward'] || measureChild['backup']) {
                 const content = (measureChild['note'] || measureChild['direction'] || measureChild['forward'] || measureChild['backup']) as Record<string, unknown>[];
                 const staffNode = content.find(n => n['staff']);
                 if (staffNode) {
                    const staffVal = staffNode['staff']?.[0]?.['#text'];
                    if (parseInt(staffVal) !== options.staffNumber) return false;
                 }
              }

              // Handle <attributes> (clef, key, time which might have 'number' attribute)
              if (measureChild['attributes']) {
                 const attrsContent = measureChild['attributes'] as Record<string, unknown>[];
                 // Filter clefs inside attributes
                 const filteredAttrs = attrsContent.filter(attrNode => {
                    if (attrNode['clef']) {
                       const clefAttrs = attrNode[':@'] as Record<string, string>;
                       if (clefAttrs?.['@_number']) {
                          return parseInt(clefAttrs['@_number']) === options.staffNumber;
                       }
                       // If no number, assumes staff 1. Keep if requesting 1, remove if requesting >1?
                       // Safer to keep default if generic.
                       return options.staffNumber === 1; 
                    }
                    if (attrNode['staves']) {
                        // Force staves count to 1
                        attrNode['staves'][0]['#text'] = 1;
                    }
                    return true;
                 });
                 // Update attributes content
                 measureChild['attributes'] = filteredAttrs;
              }
              
              return true;
            });
            child['measure'] = filteredMeasureContent;
          }

          return true;
        }
        return true; 
      });

      node['part'] = filteredMeasures;
      return true;
    }
    return true; // Keep metadata like work, identification, defaults
  });
  
  // Re-assign filtered content to the main structure
  // Because we mutated arrays in place for 'part-list' children and 'part' content logic, 
  // but 'partwise' array itself needs filtering for removed parts.
  score['score-partwise'] = filteredPartwiseContent;

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: true,
    format: true,
  });

  return builder.build(jsonObj);
}
