import { type Mocked, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigRepository } from '../repositories/config.repository.js';
import type { MediaRepository } from '../repositories/media.repository.js';
import type { OutlineRepository } from '../repositories/outline.repository.js';
import type { R2Repository } from '../repositories/r2.repository.js';
import type { SystemRepository } from '../repositories/system.repository.js';
import { ImportService } from './import.service.js';

const POST_URL = 'https://outline.immich/doc/abc';

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
      download: vi.fn().mockResolvedValue({ buffer: Buffer.from('image'), contentType: 'image/png' }),
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
      optimizeImage: vi
        .fn()
        .mockResolvedValue({ buffer: Buffer.from('webp'), extension: 'webp', contentType: 'image/webp' }),
      optimizeVideo: vi
        .fn()
        .mockResolvedValue({ buffer: Buffer.from('mp4'), extension: 'mp4', contentType: 'video/mp4' }),
    };

    r2Mock = {
      listKeys: vi.fn().mockResolvedValue([]),
      upload: vi.fn(),
      deleteKeys: vi.fn(),
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

      expect(r2Mock.upload).toHaveBeenCalledTimes(1);
      expect(r2Mock.upload).toHaveBeenCalledWith('blog/post-id-1/file-hash-1.webp', expect.any(Buffer), 'image/webp');
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
      r2Mock.listKeys.mockResolvedValue(['blog/post-id-1/file-hash-1.webp']);

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

      expect(r2Mock.upload).toHaveBeenCalledTimes(1);
    });

    it('should delete orphaned attachments that are no longer referenced', async () => {
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
      r2Mock.listKeys.mockResolvedValue(['blog/post-id-1/file-hash-1.webp', 'blog/post-id-1/orphan.webp']);

      await sut.run(POST_URL);

      expect(r2Mock.deleteKeys).toHaveBeenCalledWith(['blog/post-id-1/orphan.webp']);
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

      expect(systemMock.write).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('coverUrl: https://static.immich.cloud/blog/post-id-1/file-hash-1.webp'),
      );
      expect(systemMock.write).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('coverAlt: Cover alt'));
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
