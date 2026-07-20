export const getIdFromText = (text: string) => {
  let id = text
    .toLowerCase()
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll(/[^a-z1-9 ]/g, '')
    .replaceAll(/\s+/g, '-');

  if (id.endsWith('-')) {
    id = id.slice(0, -1);
  }

  return id;
};

export const escapeHtml = (text: string) => {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

export const escapeSvelteCode = (text: string) => {
  let escaped = text;

  for (const char of ['{', '}', '`']) {
    escaped = escaped.replaceAll(char, () => `\\${char}`);
  }

  return escaped;
};

export const createAttributes = (attributes: Record<string, string | boolean | number | null | undefined>) => {
  const results = Object.entries(attributes)
    .filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }

      return !(typeof value === 'string' && value === '');
    })
    .map(([key, value]) => {
      if (typeof value === 'number') {
        return `${key}={${value}}`;
      }

      if (typeof value === 'boolean') {
        // eslint-disable-next-line unicorn/no-incorrect-template-string-interpolation
        return value ? key : `${key}={false}`;
      }

      return `${key}="${String(value).replaceAll('"', '&quot;')}"`;
    });
  if (results.length === 0) {
    return '';
  }

  return ' ' + results.join(' ');
};
