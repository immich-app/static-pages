import type { Color } from '@immich/ui';

export type HeaderItem = {
  title: string;
  href: string;
  color?: Color;
  variant?: 'outline' | 'ghost' | 'filled';
  show?: 'always';
};

export type TimelineItem = {
  icon: string;
  iconColor: string;
  title: string;
  description?: string;
  link?: { url: string; text: string };
  done?: false;
  getDateLabel: (language: string) => string;
};
