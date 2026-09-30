import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { MediaRepository } from './media.repository.js';

const sut = new MediaRepository();

const still = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: 'teal' } })
    .png()
    .toBuffer();

// Frames must differ, or the encoder collapses them into one page.
const animated = (frames: number, width: number, height: number) =>
  sharp(Buffer.concat(Array.from({ length: frames }, (_, index) => Buffer.alloc(width * height * 3, index * 60))), {
    raw: { width, height: height * frames, channels: 3, pageHeight: height },
  })
    .gif()
    .toBuffer();

const sizes = (variants: { width: number; height: number }[]) =>
  variants.map(({ width, height }) => `${width}x${height}`);

describe(MediaRepository.name, () => {
  it.each([
    [3210, 2140, ['720x480', '1080x720', '1440x960', '2160x1440']],
    [1500, 1000, ['720x480', '1080x720', '1500x1000']],
    [500, 700, ['500x700']],
  ])('builds an AVIF ladder for a %ix%i still', async (width, height, rungs) => {
    const variants = await sut.optimizeImage(await still(width, height));

    expect(sizes(variants)).toEqual(rungs);
    expect(variants.every((variant) => variant.extension === 'avif')).toBe(true);
    for (const variant of variants) {
      const metadata = await sharp(variant.buffer).metadata();
      expect(`${metadata.width}x${metadata.height}`).toBe(`${variant.width}x${variant.height}`);
    }
  });

  it.each([
    ['untagged', (image: sharp.Sharp) => image],
    ['sRGB-tagged', (image: sharp.Sharp) => image.withIccProfile('srgb')],
    ['P3-tagged', (image: sharp.Sharp) => image.withIccProfile('p3')],
  ])('preserves the colour of a %s still', async (_, tag) => {
    const source = await tag(
      sharp({ create: { width: 720, height: 480, channels: 3, background: { r: 90, g: 160, b: 40 } } }),
    )
      .png()
      .toBuffer();
    const [variant] = await sut.optimizeImage(source);

    const toSrgb = (buffer: Buffer) => sharp(buffer).withIccProfile('srgb').raw().toBuffer();
    const [expected, actual] = await Promise.all([toSrgb(source), toSrgb(variant.buffer)]);
    for (const channel of [0, 1, 2]) {
      expect(actual[channel]).toBeCloseTo(expected[channel], -1);
    }
  });

  it('keeps EXIF orientation of an untagged still', async () => {
    const source = await sharp({ create: { width: 900, height: 600, channels: 3, background: 'teal' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    expect(sizes(await sut.optimizeImage(source))).toEqual(['600x900']);
  });

  it('builds a WebP ladder for an animation, keeping every frame', async () => {
    const variants = await sut.optimizeImage(await animated(3, 900, 600));
    const metadata = await sharp(variants[0].buffer, { animated: true }).metadata();

    expect(sizes(variants)).toEqual(['720x480', '900x600']);
    expect(variants.every((variant) => variant.extension === 'webp')).toBe(true);
    expect({ pages: metadata.pages, pageHeight: metadata.pageHeight }).toEqual({ pages: 3, pageHeight: 480 });
  });
});
