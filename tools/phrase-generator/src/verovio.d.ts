declare module 'verovio' {
  export class toolkit {
    constructor();
    setOptions(options: Record<string, unknown>): void;
    loadData(data: string): void;
    redoLayout(): void;
    renderToSVG(pageNumber: number): string;
    getSVG(options: Record<string, unknown>): string;
    getOptions(): Record<string, unknown>;
  }
  const verovio: {
    toolkit: typeof toolkit;
  };
  export default verovio;
}
