import type { IconLike } from '@immich/ui';

export type Feature = {
  title: string;
  description: string;
  icons: Array<IconLike & { href?: string }>;
  links?: FeatureLink[];
};

export type FeatureLink = {
  href: string;
  text: string;
};
