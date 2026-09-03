import { describe, expect, it } from 'vitest';
import { staleKeys } from './stale-keys.js';

const PUBLIC_URL = 'https://static.immich.cloud';
const CDN = `${PUBLIC_URL}/blog/post-1`;

const POST = `---
coverSrcset: ${CDN}/cover-720.avif
  720w, ${CDN}/cover-2160.avif
  2160w
coverUrl: ${CDN}/cover-2160.avif
---

<Markdown.Image src="${CDN}/bird-1080.avif" srcset="${CDN}/bird-720.avif 720w, ${CDN}/bird-1080.avif 1080w" />

![Old](${CDN}/legacy.webp 'left-50 =250x525')

<video autoplay src="${CDN}/clip.mp4" controls></video>
`;

const OLD = new Date('2020-01-01');

describe('staleKeys', () => {
  it('returns objects no post references, unless they were uploaded recently', () => {
    const names = ['cover-720.avif', 'cover-2160.avif', 'bird-720.avif', 'bird-1080.avif', 'legacy.webp', 'clip.mp4'];
    const objects = [
      ...names.map((name) => ({ key: `blog/post-1/${name}`, lastModified: OLD })),
      { key: 'blog/post-1/stale.webp', lastModified: OLD },
      { key: 'blog/post-2/pending-720.avif', lastModified: new Date() },
    ];

    expect(staleKeys(POST, PUBLIC_URL, objects)).toEqual(['blog/post-1/stale.webp']);
  });
});
