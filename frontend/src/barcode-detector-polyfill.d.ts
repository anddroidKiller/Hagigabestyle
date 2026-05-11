declare module "barcode-detector-polyfill" {
  export class BarcodeDetectorPolyfill {
    constructor(options?: { formats?: string[] });
    detect(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<
      Array<{ rawValue: string; format: string; boundingBox: DOMRectReadOnly }>
    >;
    static getSupportedFormats(): Promise<string[]>;
  }
}
