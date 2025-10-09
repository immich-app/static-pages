import fm from 'front-matter';
import { md } from './markdown.js';
import { SvelteFile } from './svelte-file.js';

const resolveLayout = (layout, layouts) => {
  if (layout && layouts) {
    return layouts[layout];
  }
};

const SCRIPT_BODY_REGEX = /<script.*>(?<body>(.|\n)*?)<\/script>/;

/** @param {string} content */
const parse = (content) => {
  let scriptBody = '';

  const match = SCRIPT_BODY_REGEX.exec(content);
  const bodyGroup = match?.groups?.body;
  if (bodyGroup) {
    scriptBody = bodyGroup.trim();
    content = content.substring(match.index + match[0].length).trim();
  }

  const { attributes, body } = fm(content);

  return { attributes, body, scriptBody };
};

/**
 *
 * @param {{
 *   layouts: Record<string, string>;
 * }} options
 * @returns {import('svelte/compiler').PreprocessorGroup}
 */
export const svelteMarkdownPreprocess = ({ layouts }) => {
  return {
    name: 'immich-markdown',
    async markup({ content, filename }) {
      if (!filename.endsWith('.md')) {
        return;
      }

      const { attributes, body, scriptBody } = parse(content);

      const file = new SvelteFile();
      file.addScript(`import { md } from '$lib/components/markdown';`);

      const layout = resolveLayout(attributes.layout, layouts);
      if (layout) {
        file.addScript(`import Layout from '${layout}';`);
        file.addTag(`<Layout>`, '</Layout>');
      }

      file.addScript(scriptBody);
      file.addTemplate(md.parse(body));

      return { code: file.export() };
    },
  };
};
