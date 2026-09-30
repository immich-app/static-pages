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

const flat = (background: string) => sharp({ create: { width: 64, height: 64, channels: 3, background } });

// Stored values as 0–1, leaving any embedded profile unapplied.
const storedCentre = async (avif: Buffer) => {
  const { data, info } = await sharp(avif, { ignoreIcc: true })
    .toColourspace('rgb16')
    .raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true });
  const offset = ((info.height / 2) * info.width + info.width / 2) * info.channels;
  return [...new Uint16Array(data.buffer, data.byteOffset + offset * 2, 3)].map((value) => value / 65_535);
};

const expectClose = (actual: number[], expected: number[]) =>
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 1));

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

  it('leaves untagged sRGB input unconverted and untagged', async () => {
    const [variant] = await sut.optimizeImage(await flat('#ff0000').png().toBuffer());

    expect((await sharp(variant.buffer).metadata()).hasProfile).toBe(false);
    expectClose(await storedCentre(variant.buffer), [1, 0, 0]);
  });

  it('keeps colours outside sRGB when the input is tagged P3', async () => {
    // An rgb16 pipeline treats untagged pixels as P3, so this tags pure P3 green without converting it.
    const p3Green = await flat('#00ff00').pipelineColourspace('rgb16').withIccProfile('p3').png().toBuffer();
    const [variant] = await sut.optimizeImage(p3Green);

    expect((await sharp(variant.buffer).metadata()).icc).toEqual((await sharp(p3Green).metadata()).icc);
    expectClose(await storedCentre(variant.buffer), [0, 1, 0]);
  });

  it('builds a WebP ladder for an animation, keeping every frame', async () => {
    const variants = await sut.optimizeImage(await animated(3, 900, 600));
    const metadata = await sharp(variants[0].buffer, { animated: true }).metadata();

    expect(sizes(variants)).toEqual(['720x480', '900x600']);
    expect(variants.every((variant) => variant.extension === 'webp')).toBe(true);
    expect({ pages: metadata.pages, pageHeight: metadata.pageHeight }).toEqual({ pages: 3, pageHeight: 480 });
  });
});
