import { Marked } from 'marked';

export const md = new Marked().use({
  tokenizer: {
    code(src) {
      if (src.startsWith('    ')) {
        return false;
      }
    },
  },
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      let id = text
        .toLowerCase()
        .replace(/<[^>]*>/g, '')
        .replace(/[^a-z ]/g, '')
        .replace(/\s+/g, '-');

      if (id.endsWith('-')) {
        id = id.slice(0, -1);
      }

      switch (depth) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6: {
          return `<md.heading id="${id}" level={${depth}}>${text}</md.heading>\n`;
        }
      }

      return `<md.p>${text}</md.p>\n`;
    },

    list({ items, ordered, start }) {
      const startAttribute = start && start !== 1 ? ` start={${start}}` : '';
      let output = '';
      output += `<md.list ordered={${ordered}}${startAttribute}>\n`;
      for (const item of items) {
        const content = this.parser.parse(item.tokens);
        const attributes = [item.task && 'task', item.checked && 'checked'].filter(Boolean);
        output += `  <md.li ${attributes.join(' ')}>${content}</md.li>`;
      }
      output += `</md.list>\n`;

      return output;
    },

    paragraph({ tokens }) {
      const children = this.parser.parseInline(tokens);
      return `<md.p>${children}</md.p>\n`;
    },

    code({ text, lang }) {
      return `<md.code lang="${lang}" code={\`${text}\`} multiline />\n`;
    },

    codespan({ text }) {
      return `<md.code code={\`${text}\`} />\n`;
    },

    hr() {
      return `<md.hr />\n`;
    },

    link({ href, title, text }) {
      return `<md.a href="${href}" title="${title ?? ''}">${text}</md.a>\n`;
    },
  },
});
