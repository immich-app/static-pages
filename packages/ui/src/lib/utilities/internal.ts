import type { Color, IconLike, MaybeArray, TextColor } from '$lib/types.js';
import { twMerge } from 'tailwind-merge';

export const cleanClass = (...classNames: unknown[]) => {
  return twMerge(
    classNames
      .filter((className) => {
        if (!className || typeof className === 'boolean') {
          return false;
        }

        return typeof className === 'string';
      })
      .join(' '),
  );
};

export const withPrefix = (key: string) => `immich-ui-${key}`;

let _count = 0;
export const generateId = (): string => `ui-id-${_count++}`;

export const isIconLike = (icon: unknown): icon is IconLike => {
  return typeof icon === 'string' || !!(icon && typeof icon === 'object' && 'path' in icon);
};

export const resolveIcon = ({
  icons,
  color,
  override,
  fallback,
}: {
  color: Color | TextColor;
  fallback: IconLike;
  override?: IconLike | false;
  icons: Partial<Record<Color | TextColor, string>>;
}) => {
  if (override) {
    return override;
  }

  if (override === false) {
    return;
  }

  return icons[color] ?? fallback;
};

export const asArray = <T>(items?: MaybeArray<T>) => (Array.isArray(items) ? items : items ? [items] : []);

export const escapeHtml = (text: string) => {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export const highlightHtml = (text: string, highlights: string[]): string => {
  const escaped = escapeHtml(text);
  // Longest first so a shorter match that is a prefix of a longer one (e.g.
  // "back" vs "backup") doesn't win the regex alternation and mark only part.
  const terms = highlights
    .filter(Boolean)
    .toSorted((a, b) => b.length - a.length)
    .map((term) => escapeRegExp(term));
  if (terms.length === 0) {
    return escaped;
  }

  return escaped.replaceAll(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark>$1</mark>');
};
