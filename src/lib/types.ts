import type { Color, Variants } from '@immich/ui';

export type HeaderItem = {
  title: string;
  href: string;
  color?: Color;
  variant?: Variants;
};
