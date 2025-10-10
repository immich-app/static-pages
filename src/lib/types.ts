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

export type TimelineItem = {
  icon: string;
  iconClass?: string;
  title: string;
  description?: string;
  link?: { url: string; text: string };
  done?: false;
  getDateLabel: (language: string) => string;
};
