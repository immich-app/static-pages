import { Marked } from 'marked';
import fm from 'front-matter';

const md = new Marked();

md.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);

      switch (depth) {
        case 1: {
          return `<md.h1>${text}</md.h1>`;
        }
        case 2: {
          return `<md.h2>${text}</md.h2>`;
        }
        case 3: {
          return `<md.h3>${text}</md.h3>`;
        }
        case 4: {
          return `<md.h4>${text}</md.h4>`;
        }
        case 5: {
          return `<md.h5>${text}</md.h5>`;
        }
        case 6: {
          return `<md.h6>${text}</md.h6>`;
        }
      }

      return `<md.p>${text}</md.p>`;
    },

    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<md.p>${text}</md.p>`;
    },

    code({ text, lang }) {
      return `<md.code lang="${lang}">${text}</md.code>`;
    },
  },
});

const resolveLayout = (layout, layouts) => {
  if (layout && layouts) {
    return layouts[layout];
  }
};

class SvelteFile {
  /**
   * @type {string[]}
   * @private
   */
  imports = [];

  /**
   * @type {string[]}
   * @private
   */
  lines = [];

  level = 0;

  constructor() {}

  /** @type {string} */
  addImport(line) {
    this.imports.push(line);
    return this;
  }

  /** @type {string} */
  addLine(line) {
    this.lines.push(line);
    return this;
  }

  export() {
    const lines = [];

    lines.push(`<script lang="ts">`);
    for (const line of this.imports) {
      lines.push('  ' + line);
    }
    lines.push('</script>');

    for (const line of this.lines) {
      lines.push(line);
    }

    return lines.join('\n');
  }
}

/**
 *
 * @param {{
 *   layouts: Record<string, string>;
 * }} options
 * @returns
 */
export const svelteMarkdownPreprocess = ({ layouts }) => {
  return {
    name: 'immich-markdown',
    async markup({ content, filename }) {
      if (!filename.endsWith('.md')) {
        return;
      }

      const file = new SvelteFile();

      const { attributes, body } = fm(content);
      file.addImport(`import { md } from '$lib/components/markdown';`);

      const layout = resolveLayout(attributes.layout, layouts);
      if (layout) {
        file.addImport(`import Layout from ${layout};`);
        file.addLine(`<Layout>`);
      }

      file.addLine(md.parse(content));

      if (layout) {
        file.addLine(`</Layout>`);
      }

      return { code: file.export() };
    },
  };
};
