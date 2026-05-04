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

export const escapeSvelteCode = (text: string) => {
  let escaped = text;

  for (const char of ['{', '}', '`']) {
    escaped = escaped.replaceAll(char, `\\${char}`);
  }

  return escaped;
};

export const createAttributes = (attributes: Record<string, string | boolean | number | null | undefined>) => {
  const results = Object.entries(attributes)
    .filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }

      if (typeof value === 'string' && value === '') {
        return false;
      }

      return true;
    })
    .map(([key, value]) => {
      if (typeof value === 'number') {
        return `${key}={${value}}`;
      }

      if (typeof value === 'boolean') {
        return value ? `${key}` : `${key}={false}`;
      }

      return `${key}="${value}"`;
    });
  if (results.length === 0) {
    return '';
  }

  return ' ' + results.join(' ');
};
