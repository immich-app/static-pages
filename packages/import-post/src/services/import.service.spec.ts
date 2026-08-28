import { type Mocked, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigRepository } from '../repositories/config.repository.js';
import type { MediaRepository } from '../repositories/media.repository.js';
import type { OutlineRepository } from '../repositories/outline.repository.js';
import type { R2Repository } from '../repositories/r2.repository.js';
import type { SystemRepository } from '../repositories/system.repository.js';
import { PIPELINE_VERSION } from '../constants.js';
import { ImportService } from './import.service.js';

const POST_URL = 'https://outline.immich/doc/abc';
const SOURCE_BUFFER = Buffer.from('image');

const RUNGS = [
  [720, 480],
  [1080, 720],
  [1440, 960],
  [2160, 1440],
] as const;

const IMAGE_VARIANTS = RUNGS.map(([width, height]) => ({
  buffer: Buffer.from('avif'),
  width,
  height,
  extension: 'avif',
}));

const variantKeys = (hash: string) => RUNGS.map(([width]) => `blog/post-id-1/${hash}-${width}.avif`);

type Mock<T extends object> = Mocked<Pick<T, keyof T>>;
type Real<T> = T extends Mock<infer U> ? U : never;

const config = {
  outlineApiKey: 'key',
  rootPath: '/tmp/repo',
  r2: {
    bucket: 'bucket',
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    publicUrl: 'https://static.immich.cloud',
  },
};

describe(ImportService.name, () => {
  let configMock: Mock<ConfigRepository>;
  let outlineMock: Mock<OutlineRepository>;
  let systemMock: Mock<SystemRepository>;
  let mediaMock: Mock<MediaRepository>;
  let r2Mock: Mock<R2Repository>;
  let sut: ImportService;

  beforeEach(() => {
    configMock = {
      get: vi.fn().mockReturnValue(config),
    };

    outlineMock = {
      getDocument: vi.fn(),
      download: vi.fn().mockResolvedValue({ buffer: SOURCE_BUFFER, contentType: 'image/png' }),
      getAttachmentId: vi.fn().mockReturnValue('attachment-id'),
    };

    systemMock = {
      confirm: vi.fn().mockResolvedValue(true),
      md5: vi.fn(),
      write: vi.fn(),
      format: vi.fn(),
      append: vi.fn(),
    };

    mediaMock = {
      optimizeImage: vi.fn().mockResolvedValue(IMAGE_VARIANTS),
      optimizeVideo: vi
        .fn()
        .mockResolvedValue({ buffer: Buffer.from('mp4'), extension: 'mp4', contentType: 'video/mp4' }),
    };

    r2Mock = {
      listKeys: vi.fn().mockResolvedValue([]),
      upload: vi.fn(),
    };

    sut = new ImportService(
      configMock as Real<ConfigRepository>,
      outlineMock as Real<OutlineRepository>,
      systemMock as Real<SystemRepository>,
      mediaMock as Real<MediaRepository>,
      r2Mock as Real<R2Repository>,
    );
  });

  describe('attachment sync', () => {
    it('should upload a new image', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
---

![alt](https://outline.immich/a.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');

      await sut.run(POST_URL);

      expect(r2Mock.upload.mock.calls).toEqual(
        variantKeys('file-hash-1').map((key) => [key, expect.any(Buffer), 'image/avif']),
      );
    });

    it('should not re-upload an image already present in the bucket', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
---

![alt](https://outline.immich/a.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');
      r2Mock.listKeys.mockResolvedValue(variantKeys('file-hash-1'));

      await sut.run(POST_URL);

      expect(r2Mock.upload).not.toHaveBeenCalled();
    });

    it('should upload duplicate images within a document only once', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
---

![alt](https://outline.immich/a.png)

![alt](https://outline.immich/a.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');

      await sut.run(POST_URL);

      expect(r2Mock.upload).toHaveBeenCalledTimes(RUNGS.length);
    });

    it('should hash the source rather than the encoder output', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
---

![alt](https://outline.immich/a.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');

      await sut.run(POST_URL);

      expect(systemMock.md5).toHaveBeenCalledTimes(1);
      expect(systemMock.md5).toHaveBeenCalledWith(Buffer.concat([Buffer.from(PIPELINE_VERSION), SOURCE_BUFFER]));
    });
  });

  describe('metadata', () => {
    it('should default the published date to today', async () => {
      const today = new Date().toISOString().slice(0, 10);
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
---

Body.`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(`publishedAt: ${today}`),
      );
    });

    it('should use the published date from front matter', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
publishedAt: 2020-01-02
---

Body.`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('publishedAt: 2020-01-02'),
      );
    });

    it('should default the title to the document title', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Document Title',
        text: `---
slug: test
---

Body.`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('title: Document Title'),
      );
    });

    it('should use the title from front matter', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Document Title',
        text: `---
title: Front Matter Title
slug: test
---

Body.`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('title: Front Matter Title'),
      );
    });

    it('should derive the slug from the title by default', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Hello World',
        text: `---
title: Hello World
---

Body.`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.stringContaining('(posts)/hello-world/+page.md'),
        expect.any(String),
      );
    });

    it('should use the slug from front matter', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Hello World',
        text: `---
title: Hello World
slug: custom-slug
---

Body.`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.stringContaining('(posts)/custom-slug/+page.md'),
        expect.any(String),
      );
    });
  });

  describe('post type', () => {
    it.each([
      ['release', 'releases'],
      ['post', 'posts'],
      ['announcement', 'announcements'],
    ])('should write a "%s" post to the (%s) folder', async (type, folder) => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
type: ${type}
---

Body.`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.stringContaining(`(${folder})/test/+page.md`),
        expect.any(String),
      );
    });
  });

  describe('cover image', () => {
    it('should use the first image as the cover for non-release posts', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
type: post
---

![Cover alt](https://outline.immich/a.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');

      await sut.run(POST_URL);

      const frontMatter = systemMock.write.mock.calls[0][1];
      expect(frontMatter).toContain(
        'coverAlt: Cover alt\ncoverHeight: 1440\ncoverSrcset: https://static.immich.cloud/blog/post-id-1/file-hash-1-720.avif',
      );
      expect(frontMatter).toContain(
        'coverUrl: https://static.immich.cloud/blog/post-id-1/file-hash-1-2160.avif\ncoverWidth: 2160',
      );
    });

    it('should remove the cover image from the body', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
type: post
---

![Cover alt](https://outline.immich/a.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(expect.any(String), expect.not.stringContaining('!['));
    });

    it('should use the first of multiple images as the cover', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
type: post
---

![First](https://outline.immich/a.png)

![Second](https://outline.immich/b.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('coverAlt: First'));
    });

    it('should not set a cover for release posts', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
type: release
---

![Cover alt](https://outline.immich/a.png)`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(expect.any(String), expect.not.stringContaining('coverUrl'));
    });
  });

  describe('rendered markup', () => {
    const withBody = (text: string) => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---\ntitle: Test\nslug: test\ntype: release\n---\n\n${text}`,
      });
      systemMock.md5.mockReturnValue('file-hash-1');
    };

    const body = () => systemMock.write.mock.calls.at(-1)![1];

    it('should ship the whole srcset, so a later ladder change cannot orphan the post', async () => {
      withBody('![A bird](https://outline.immich/a.png)');

      await sut.run(POST_URL);

      const stem = 'https://static.immich.cloud/blog/post-id-1/file-hash-1';
      expect(body()).toContain(
        `<Markdown.Image src="${stem}-2160.avif" srcset="${RUNGS.map(([width]) => `${stem}-${width}.avif ${width}w`).join(', ')}" width="2160" height="1440" alt="A bird" />`,
      );
    });

    it('should leave the srcset off an image with a single rung', async () => {
      withBody('![A bird](https://outline.immich/a.gif)');
      mediaMock.optimizeImage.mockResolvedValue([
        { buffer: Buffer.from('webp'), width: 600, height: 400, extension: 'webp' },
      ]);

      await sut.run(POST_URL);

      expect(r2Mock.upload).toHaveBeenCalledWith(
        'blog/post-id-1/file-hash-1-600.webp',
        expect.any(Buffer),
        'image/webp',
      );
      expect(body()).toContain(
        '<Markdown.Image src="https://static.immich.cloud/blog/post-id-1/file-hash-1-600.webp" width="600" height="400" alt="A bird" />',
      );
    });

    it('should escape braces, which would otherwise open a svelte expression', async () => {
      withBody('![The {count} badge](https://outline.immich/a.png)');

      await sut.run(POST_URL);

      expect(body()).toContain('alt="The &lbrace;count&rbrace; badge"');
    });

    it('should keep the video markup', async () => {
      withBody('[clip](/api/attachments.redirect?id=1)');
      outlineMock.download.mockResolvedValue({ buffer: SOURCE_BUFFER, contentType: 'video/mp4' });
      systemMock.md5.mockReturnValue('video-hash');

      await sut.run(POST_URL);

      expect(body()).toContain(
        '<video autoplay src="https://static.immich.cloud/blog/post-id-1/video-hash.mp4" controls>Your browser does not support the video tag.</video>',
      );
    });
  });

  describe('markdown', () => {
    it('should not escape angle-bracket placeholders with a backslash', async () => {
      outlineMock.getDocument.mockResolvedValue({
        id: 'post-id-1',
        title: 'Test',
        text: `---
title: Test
slug: test
type: release
---

<example placeholder?>`,
      });

      await sut.run(POST_URL);

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('<example placeholder?>'),
      );
      expect(systemMock.write).toHaveBeenCalledWith(expect.any(String), expect.not.stringContaining(String.raw`\<`));
    });
  });
});
