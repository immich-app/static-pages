import type { Color } from '@immich/ui';

export type HeaderItem = {
  title: string;
  href: string;
  icon?: string | { path: string };
  color?: Color;
  variant?: 'outline' | 'ghost' | 'filled';
  show?: 'always';
  external?: boolean;
};
