export interface HighlightConfig {
  slug: string;
  startMeasure: number;
  endMeasure: number;
  description: string;
}

export interface WorkConfig {
  url: string;
  composer: string;
  work: string;
  highlights: HighlightConfig[];
}

export interface EngravingOptions {
  scale?: number;
  pageWidth?: number;
  spacingLinear?: number;
  spacingNonLinear?: number;
}
