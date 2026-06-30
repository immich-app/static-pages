import { blogMetadata, posts } from '$lib';
import { Feed } from 'feed';
import fm from 'front-matter';
import { DateTime } from 'luxon';
import { marked, type Token, type Tokens } from 'marked';
import { emojify } from 'node-emoji';

export const feed = new Feed({
  title: blogMetadata.title,
  description: blogMetadata.description,
  id: 'https://immich.app/blog',
  link: 'https://immich.app/blog',
  language: 'en',
  copyright: `Copyright © ${DateTime.now().year} FUTO. All rights reserved.`,
  favicon: 'https://immich.app/favicon.ico',
});

for (const post of posts) {
  feed.addItem({
    title: post.title,
    id: post.id,
    link: 'https://immich.app' + post.url,
    description: post.description,
    author: post.authors.map((author) => ({ name: author })),
    date: (post.modifiedAt ?? post.publishedAt).toJSDate(),
    published: post.publishedAt.toJSDate(),
  });
}

const ADMONITION_REGEX = /^:::(?<variant>\w+)?(?:[ \t]+(?<title>[^\n]+?))?[ \t]*\n(?<body>[\s\S]*?)\n:::[ \t]*(?:\n|$)/;

marked.use({
  extensions: [
    {
      name: 'alert',
      level: 'block',
      start(src) {
        return src.match(/^:::/m)?.index;
      },
      tokenizer(src) {
        const match = ADMONITION_REGEX.exec(src);
        if (!match?.groups) {
          return;
        }

        const { variant, title, body } = match.groups;

        return {
          type: 'alert',
          raw: match[0],
          variant: variant?.toLowerCase(),
          title,
          // eslint-disable-next-line unicorn/no-this-outside-of-class
          tokens: this.lexer.blockTokens(body, []),
        };
      },
    },
  ],
});

export const markdownToText = (markdown: string): string => {
  const tokens = marked.lexer(fm(markdown).body);
  return (
    tokens
      .map((token) => blockToText(token))
      .join(' ')
      // strip html/jsx tags, keeping their inner text
      .replaceAll(/<[^>]*>/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
  );
};

const inlineToText = (tokens: Token[]): string => {
  return tokens
    .map((token) => {
      // For links, use the visible text and drop the url.
      if ('tokens' in token && token.tokens) {
        return inlineToText(token.tokens);
      }
      return 'text' in token ? emojify((token as Tokens.Text).text) : '';
    })
    .join('');
};

const blockToText = (token: Token): string => {
  switch (token.type) {
    case 'html': {
      // drop script blocks entirely, keep inner text for everything else
      return /^\s*<script[\s>]/i.test(token.text) ? '' : token.text;
    }
    case 'alert': {
      return ((token as Tokens.Generic).tokens ?? []).map((child) => blockToText(child)).join(' ');
    }
    case 'heading':
    case 'paragraph': {
      return inlineToText(token.tokens ?? []);
    }
    default: {
      return '';
    }
  }
};
