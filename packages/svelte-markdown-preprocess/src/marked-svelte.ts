import { MarkedExtension, Token, Tokens } from 'marked';
import { emojify } from 'node-emoji';
import { createAttributes, escapeSvelteCode, getIdFromText } from './utility.js';

const ALERT_VARIANTS = ['note', 'tip', 'important', 'warning', 'caution', 'info', 'success', 'danger'] as const;

const GFM_ALERT_REGEX = new RegExp(String.raw`^\[!(?<variant>${ALERT_VARIANTS.join('|')})\]\s*?\n*`, 'i');

const ADMONITION_REGEX = new RegExp(
  String.raw`^:::(?<variant>${ALERT_VARIANTS.join('|')})(?:[ \t]+(?<title>[^\n]+?))?[ \t]*\n(?<body>[\s\S]*?)\n:::[ \t]*(?:\n|$)`,
);

type AlertToken = Tokens.Generic & {
  type: 'alert';
  variant: string;
  title?: string;
  tokens: Token[];
};

const renderAlert = (
  parser: { parse: (tokens: Token[]) => string },
  variant: string,
  title: string | undefined,
  tokens: Token[],
) => `<Markdown.Alert${createAttributes({ variant, title })}>${parser.parse(tokens)}</Markdown.Alert>\n`;

export const markedSvelte = (): MarkedExtension => ({
  gfm: true,

  walkTokens(token) {
    if (token.type !== 'blockquote') {
      return;
    }
    const blockquote = token as Tokens.Blockquote;
    const match = GFM_ALERT_REGEX.exec(blockquote.text);
    if (!match?.groups) {
      return;
    }

    Object.assign(blockquote, { type: 'alert', variant: match.groups.variant.toLowerCase() });

    const firstChild = blockquote.tokens?.[0] as Tokens.Paragraph | undefined;
    if (!firstChild) {
      return;
    }

    if (firstChild.raw?.replace(GFM_ALERT_REGEX, '').trim()) {
      const innerFirst = firstChild.tokens?.[0] as Tokens.Text | undefined;
      if (innerFirst) {
        innerFirst.raw = innerFirst.raw.replace(GFM_ALERT_REGEX, '');
        innerFirst.text = innerFirst.text.replace(GFM_ALERT_REGEX, '');
      }
      if (firstChild.tokens?.[1]?.type === 'br') {
        firstChild.tokens.splice(1, 1);
      }
    } else {
      blockquote.tokens?.shift();
    }
  },

  tokenizer: {
    code(src) {
      if (src.startsWith('    ')) {
        return false;
      }
    },
  },

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
          variant: variant.toLowerCase(),
          title,
          tokens: this.lexer.blockTokens(body, []),
        };
      },
      renderer(token) {
        const { variant, title, tokens } = token as unknown as AlertToken;
        return renderAlert(this.parser, variant, title, tokens);
      },
    },
  ],

  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = getIdFromText(text);
      switch (depth) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6: {
          return `<Markdown.Heading${createAttributes({ id, level: depth })}>${text}</Markdown.Heading>\n`;
        }
      }

      return `<Markdown.Paragraph>${text}</Markdown.Paragraph>\n`;
    },

    list({ items, ordered, start }) {
      let output = `<Markdown.List${createAttributes({ ordered, start: start === 1 ? undefined : start })}>\n`;
      for (const item of items) {
        const content = this.parser.parse(item.tokens);
        output += `<Markdown.ListItem${createAttributes({ task: item.task ? true : undefined, checked: item.checked })}>${content}</Markdown.ListItem>\n`;
      }
      output += `</Markdown.List>\n`;

      return output;
    },

    blockquote({ tokens }) {
      const children = this.parser.parse(tokens);
      return `<Markdown.BlockQuote>${children}</Markdown.BlockQuote>\n`;
    },

    paragraph({ tokens }) {
      const children = this.parser.parseInline(tokens);

      // pass through svelte syntax unchanged
      if (
        children.startsWith('{#') ||
        children.startsWith('{/') ||
        children.startsWith('{:') ||
        children.startsWith('{@')
      ) {
        return children;
      }
      return `<Markdown.Paragraph>${children}</Markdown.Paragraph>\n`;
    },

    text(token) {
      if (token.type === 'text') {
        return token.tokens ? this.parser.parseInline(token.tokens) : emojify(token.text);
      }

      return token.text;
    },

    image({ href, text: alt, title }) {
      return `<Markdown.Image${createAttributes({ src: href, alt, title })}/>\n`;
    },

    space() {
      return `<Markdown.Space />\n`;
    },

    table({ header, rows }) {
      // table
      let output = `<Markdown.Table>\n`;

      // header
      output += `<Markdown.TableHeader>\n`;
      for (const cell of header) {
        const content = this.parser.parseInline(cell.tokens);
        output += `<Markdown.TableHeading>${content}</Markdown.TableHeading>\n`;
      }
      output += `</Markdown.TableHeader>\n`;

      // body
      output += `<Markdown.TableBody>\n`;
      for (const row of rows) {
        output += `<Markdown.TableRow>\n`;
        for (const cell of row) {
          const content = this.parser.parseInline(cell.tokens);
          output += `<Markdown.TableCell>${content}</Markdown.TableCell>\n`;
        }
        output += `</Markdown.TableRow>\n`;
      }
      output += `</Markdown.TableBody>\n`;

      output += `</Markdown.Table>\n`;

      return output;
    },

    code({ text, lang }) {
      const escaped = escapeSvelteCode(text);
      return `<Markdown.Code lang="${lang}" code={\`${escaped}\`} multiline />\n`;
    },

    hr() {
      return `<Markdown.LineBreak />\n`;
    },

    link({ href, title, text }) {
      return `<Markdown.Link${createAttributes({ href, title })}>${text}</Markdown.Link>`;
    },

    codespan({ text }) {
      return `<Markdown.Code code={\`${text}\`} />`;
    },
  },
});
