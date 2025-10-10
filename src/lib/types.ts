import type { Color } from '@immich/ui';
import type { Component } from 'svelte';

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

export type Feature = {
  icon: string;
  title: string;
  description: string;
  href: string;
  content: Component;
};
