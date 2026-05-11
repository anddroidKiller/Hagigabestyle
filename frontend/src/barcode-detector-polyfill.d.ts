declare module "barcode-detector/ponyfill" {
  export class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(
      source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap | VideoFrame
    ): Promise<Array<{ rawValue: string; format: string; boundingBox: DOMRectReadOnly }>>;
    static getSupportedFormats(): Promise<string[]>;
  }
  export function setZXingModuleOverrides(overrides: Record<string, unknown>): void;
  export function prepareZXingModule(): Promise<void>;
}
