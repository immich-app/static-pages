import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';
import { svelteMarkdownPreprocess } from '../src/index.js';

const fixtureMap: Record<string, { default: string }> = import.meta.glob('./fixtures/*.md', {
  query: '?raw',
  eager: true,
});
const fixtures = Object.entries(fixtureMap).map(([filepath, { default: content }]) => ({
  filename: basename(filepath),
  filepath,
  content,
}));

describe('markup', () => {
  it.each(fixtures)('should render $filename correctly', async ({ filename, content }) => {
    const sut = svelteMarkdownPreprocess({});
    const output = await sut.markup({ content, filename });
    expect(output).toMatchSnapshot();
  });
});

describe('paragraph', () => {
  it.each([
    { name: 'component image after a space', content: '&#x20;<Markdown.Image src="/a.avif" alt="" />' },
    { name: 'images side by side', content: '![a](/a.webp) ![b](/b.webp)' },
    { name: 'images on consecutive lines', content: '![a](/a.webp)\n![b](/b.webp)' },
    {
      name: 'component images together',
      content: '&#x20;<Markdown.Image src="/a.avif" />\n<Markdown.Image src="/b.avif" />',
    },
  ])('should not wrap $name in a paragraph', async ({ content }) => {
    const sut = svelteMarkdownPreprocess({});
    const output = await sut.markup({ content: `${content}\n`, filename: 'a.md' });
    expect(output?.code).not.toContain('<Markdown.Paragraph>');
  });
});

describe('image beside text', () => {
  const IMAGE_IN_PARAGRAPH = /<Markdown\.Paragraph>(?:(?!<\/Markdown\.Paragraph>)[\s\S])*<Markdown\.Image/;

  it.each([
    { name: 'an image', content: 'see ![a](/a.webp) here' },
    { name: 'a component image', content: 'see <Markdown.Image src="/a.webp" /> here' },
    { name: 'a linked image', content: 'see [![a](/a.webp)](https://immich.app) here' },
  ])('should split $name out of the paragraph', async ({ content }) => {
    const sut = svelteMarkdownPreprocess({});
    const output = await sut.markup({ content: `${content}\n`, filename: 'a.md' });
    expect(output?.code).not.toMatch(IMAGE_IN_PARAGRAPH);
    expect(output?.code).toContain('<Markdown.Paragraph>see </Markdown.Paragraph>');
    expect(output?.code).toContain('<Markdown.Paragraph> here</Markdown.Paragraph>');
  });
});
