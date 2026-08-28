import { availableParallelism } from 'node:os';
import type { Channels, OutputInfo } from 'sharp';
import sharp from 'sharp';
import type { ImageVariant, OptimizeResult } from '../types.js';

// Each post ships the srcset it was built with, so changing these only affects later imports.
const IMAGE_WIDTHS = [720, 1080, 1440, 2160];

// A rung within a hair of the top one can encode larger than the wider rung it duplicates.
const imageLadder = (sourceWidth: number) => {
  const top = Math.min(sourceWidth, IMAGE_WIDTHS.at(-1)!);
  return [...IMAGE_WIDTHS.filter((width) => width < top * 0.9), top];
};

type P3Bitmap = { pixels: Uint16Array; raw: { width: number; height: number; channels: Channels } };

// sharp takes buffer depth from the TypedArray constructor rather than `info.depth`
const toP3Bitmap = ({ data, info }: { data: Buffer; info: OutputInfo }): P3Bitmap => ({
  pixels: new Uint16Array(data.buffer, data.byteOffset, data.byteLength / 2),
  raw: { width: info.width, height: info.height, channels: info.channels as Channels },
});

export class MediaRepository {
  constructor() {
    sharp.concurrency(availableParallelism()); // sharp pins libvips to one thread on glibc without jemalloc
  }

  async optimizeImage(buffer: Buffer): Promise<ImageVariant[]> {
    const { pages, width } = await sharp(buffer).metadata();
    return pages && pages > 1 ? this.encodeAnimations(buffer, width) : this.encodeStills(buffer);
  }

  async optimizeVideo(buffer: Buffer): Promise<OptimizeResult> {
    // todo
    const output = buffer;
    return {
      buffer: output,
      extension: 'mp4',
      contentType: 'video/mp4',
    };
  }

  private async encodeStills(buffer: Buffer): Promise<ImageVariant[]> {
    const source = await this.decode(buffer);
    const variants: ImageVariant[] = [];
    for (const width of imageLadder(source.raw.width)) {
      const { data, info } = await this.encodeStill(await this.resizeInLinearLight(source, width));
      variants.push({ buffer: data, width: info.width, height: info.height, extension: 'avif' });
    }
    return variants;
  }

  private async encodeAnimations(buffer: Buffer, sourceWidth: number): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];
    for (const width of imageLadder(sourceWidth)) {
      const { data, info } = await sharp(buffer, { animated: true })
        .resize({ width })
        .webp({ quality: 85, effort: 6 }) // libvips doesn't support animated AVIF yet
        .toBuffer({ resolveWithObject: true });
      variants.push({ buffer: data, width: info.width, height: info.pageHeight!, extension: 'webp' });
    }
    return variants;
  }

  private async decode(buffer: Buffer): Promise<P3Bitmap> {
    return toP3Bitmap(
      await sharp(buffer, { autoOrient: true })
        .pipelineColourspace('rgb16')
        .withIccProfile('p3')
        .toColourspace('rgb16')
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true }),
    );
  }

  private async resizeInLinearLight(source: P3Bitmap, width: number): Promise<P3Bitmap> {
    return toP3Bitmap(
      await sharp(source.pixels, { raw: source.raw })
        .pipelineColourspace('scrgb')
        .resize({ width })
        .toColourspace('rgb16')
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true }),
    );
  }

  // Folding this into the resize would encode against sRGB rather than P3
  private encodeStill(bitmap: P3Bitmap) {
    return sharp(bitmap.pixels, { raw: bitmap.raw })
      .pipelineColourspace('rgb16')
      .withIccProfile('p3')
      .toColourspace('rgb16')
      .avif({ quality: 67, bitdepth: 10, effort: 6 })
      .toBuffer({ resolveWithObject: true });
  }
}
