import { describe, expect, it } from 'vitest';
import {
  FileWithContent,
  FileWithMarkup,
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
      expect(result).toMatchObject({ code: expect.stringContaining(`<Layout {attributes}>`) });
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
        parseLayout(file: FileWithMarkup) {
          return { ...file, layout: '$lib/layouts/Custom.svelte' };
        }
      }

      await expect(new CustomPlugin().markup({ filename: 'test.md', content: `# Hello` })).resolves.toMatchObject({
        code: expect.stringContaining("import Layout from '$lib/layouts/Custom.svelte'"),
      });
    });
  });
});
