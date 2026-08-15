import { describe, expect, it } from 'vitest';
import {
  FileWithContent,
  FileWithImages,
  FileWithScriptBody,
  SvelteMarkdownPreprocess,
  svelteMarkdownPreprocess,
} from './index';

describe(svelteMarkdownPreprocess.name, () => {
  it('should work', async () => {
    await expect(
      svelteMarkdownPreprocess().markup({ filename: 'test.md', content: `# Hello` }),
    ).resolves.toMatchSnapshot();
  });

  describe('extensions', () => {
    it('should ignore other extensions', async () => {
      await expect(
        svelteMarkdownPreprocess().markup({ filename: 'test.txt', content: `Hello` }),
      ).resolves.toBeUndefined();
    });

    it('should allow overriding extensions', async () => {
      await expect(
        svelteMarkdownPreprocess({ extensions: ['md'] }).markup({ filename: 'test.mdx', content: `Hello` }),
      ).resolves.toBeUndefined();
    });
  });

  describe('layouts', () => {
    it('should accept and use a default layout', async () => {
      await expect(
        svelteMarkdownPreprocess({ layouts: { default: '$lib/layouts/DefaultLayout.svelte' } }).markup({
          filename: 'test.md',
          content: `# Hello`,
        }),
      ).resolves.toMatchObject({
        code: expect.stringContaining("import Layout from '$lib/layouts/DefaultLayout.svelte'"),
      });
    });

    it('should accept and use a layout attribute in front matter', async () => {
      await expect(
        svelteMarkdownPreprocess({
          layouts: {
            default: '$lib/layouts/DefaultLayout.svelte',
            PostLayout: '$lib/layouts/PostLayout.svelte',
          },
        }).markup({
          filename: 'test.md',
          content: `---\nlayout: PostLayout\n---\n# Hello`,
        }),
      ).resolves.toMatchObject({
        code: expect.stringContaining("import Layout from '$lib/layouts/PostLayout.svelte'"),
      });
    });

    it('should pass attributes to the layout component', async () => {
      const result = await svelteMarkdownPreprocess({
        layouts: { default: '$lib/layouts/DefaultLayout.svelte' },
      }).markup({
        filename: 'test.md',
        content: `---\ntitle: Test\n---\n# Hello`,
      });

      expect(result).toMatchObject({ code: expect.stringContaining(`const attributes = {"title":"Test"}`) });
      // eslint-disable-next-line unicorn/no-incorrect-template-string-interpolation
      expect(result).toMatchObject({ code: expect.stringContaining(`<Layout {attributes}>`) });
    });
  });

  describe('images', () => {
    it('should import relative images so vite can optimize them', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `![Alt text](./img/example.webp "Example")`,
      });

      expect(result).toMatchObject({ code: expect.stringContaining(`import __image_0 from './img/example.webp';`) });
      expect(result).toMatchObject({
        // eslint-disable-next-line unicorn/no-incorrect-template-string-interpolation
        code: expect.stringContaining(`<Markdown.Image src={__image_0} alt="Alt text" title="Example"/>`),
      });
    });

    it('should import images from a parent directory', async () => {
      await expect(
        svelteMarkdownPreprocess().markup({ filename: 'test.md', content: `![](../img/example.webp)` }),
      ).resolves.toMatchObject({ code: expect.stringContaining(`import __image_0 from '../img/example.webp';`) });
    });

    it('should reuse a single import for a repeated image', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `![One](./img/example.webp)\n\n![Two](./img/example.webp)`,
      });

      expect(result?.code.match(/import __image_0/g)).toHaveLength(1);
      expect(result?.code).not.toContain('__image_1');
      expect(result?.code.match(/src=\{__image_0}/g)).toHaveLength(2);
    });

    it('should give each distinct image its own import', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `![One](./img/one.webp)\n\n![Two](./img/two.webp)`,
      });

      expect(result?.code).toContain(`import __image_0 from './img/one.webp';`);
      expect(result?.code).toContain(`import __image_1 from './img/two.webp';`);
    });

    it('should leave absolute and remote images alone', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `![One](/img/one.webp)\n\n![Two](https://immich.app/two.webp)`,
      });

      expect(result?.code).not.toContain('import __image_0');
      expect(result?.code).toContain(`src="/img/one.webp"`);
      expect(result?.code).toContain(`src="https://immich.app/two.webp"`);
    });

    it('should import relative images in img tags', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `<img src="./img/example.webp" alt="Alt text">`,
      });

      expect(result?.code).toContain(`import __image_0 from './img/example.webp';`);
      // eslint-disable-next-line unicorn/no-incorrect-template-string-interpolation
      expect(result?.code).toContain(`<img src={__image_0} alt="Alt text">`);
    });

    it('should import img tags from a parent directory', async () => {
      await expect(
        svelteMarkdownPreprocess().markup({ filename: 'test.md', content: `<img src="../img/example.webp">` }),
      ).resolves.toMatchObject({ code: expect.stringContaining(`import __image_0 from '../img/example.webp';`) });
    });

    it('should import relative images in img tags with attributes before the src', async () => {
      await expect(
        svelteMarkdownPreprocess().markup({
          filename: 'test.md',
          content: `<img class="rounded" src="./img/example.webp">`,
        }),
        // eslint-disable-next-line unicorn/no-incorrect-template-string-interpolation
      ).resolves.toMatchObject({ code: expect.stringContaining(`<img class="rounded" src={__image_0}>`) });
    });

    it('should leave absolute and remote img tags alone', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `<img src="/img/one.webp">\n\n<img src="https://immich.app/two.webp">`,
      });

      expect(result?.code).not.toContain('import __image_0');
      expect(result?.code).toContain(`src="/img/one.webp"`);
      expect(result?.code).toContain(`src="https://immich.app/two.webp"`);
    });

    it('should reuse a single import across markdown and img tag references', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `![One](./img/example.webp)\n\n<img src="./img/example.webp">`,
      });

      expect(result?.code.match(/import __image_0/g)).toHaveLength(1);
      expect(result?.code).not.toContain('__image_1');
      expect(result?.code.match(/src=\{__image_0}/g)).toHaveLength(2);
    });

    it('should not treat other tags as images', async () => {
      const result = await svelteMarkdownPreprocess().markup({
        filename: 'test.md',
        content: `<video src="./video/example.webm"></video>`,
      });

      expect(result?.code).not.toContain('import __image_0');
      expect(result?.code).toContain(`src="./video/example.webm"`);
    });
  });

  describe('method overrides', () => {
    it('should allow injecting front matter', async () => {
      class CustomPlugin extends SvelteMarkdownPreprocess {
        constructor() {
          super({
            layouts: {
              default: '$lib/layouts/DefaultLayout.svelte',
              PostLayout: '$lib/layouts/PostLayout.svelte',
            },
          });
        }
        async parseFrontMatter(file: FileWithContent) {
          const result = await super.parseFrontMatter(file);
          result.attributes.foo = 'bar';
          result.attributes.layout = 'PostLayout';
          return result;
        }
      }

      await expect(new CustomPlugin().markup({ filename: 'test.md', content: `# Hello` })).resolves.toMatchObject({
        code: expect.stringContaining("import Layout from '$lib/layouts/PostLayout.svelte'"),
      });
    });

    it('should allow injecting markdown', async () => {
      class CustomPlugin extends SvelteMarkdownPreprocess {
        async parseFrontMatter(file: FileWithContent) {
          const result = await super.parseFrontMatter(file);
          result.body += `\n## Injected content`;
          return result;
        }
      }

      await expect(new CustomPlugin().markup({ filename: 'test.md', content: `# Hello` })).resolves.toMatchObject({
        code: expect.stringContaining(
          '<Markdown.Heading id="injected-content" level={2}>Injected content</Markdown.Heading>',
        ),
      });
    });

    it('should allow injecting markup', async () => {
      class CustomPlugin extends SvelteMarkdownPreprocess {
        async parseMarkdown(file: FileWithScriptBody) {
          const result = await super.parseMarkdown(file);
          result.markup += `<Markdown.Text>Footer</Markdown.Text>\n`;
          return result;
        }
      }

      await expect(new CustomPlugin().markup({ filename: 'test.md', content: `# Hello` })).resolves.toMatchObject({
        code: expect.stringContaining('<Markdown.Text>Footer</Markdown.Text>'),
      });
    });

    it('should allow injecting a layout', async () => {
      class CustomPlugin extends SvelteMarkdownPreprocess {
        parseLayout(file: FileWithImages) {
          return { ...file, layout: '$lib/layouts/Custom.svelte' };
        }
      }

      await expect(new CustomPlugin().markup({ filename: 'test.md', content: `# Hello` })).resolves.toMatchObject({
        code: expect.stringContaining("import Layout from '$lib/layouts/Custom.svelte'"),
      });
    });
  });
});
