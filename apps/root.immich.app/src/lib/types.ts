import type { ClientDoc } from '@immich/svelte-markdown-preprocess';
import type { IconLike } from '@immich/ui';
import type { DateTime } from 'luxon';

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

// keep in sync with blog/(type) folders
export enum BlogType {
  Announcement = 'announcement',
  Post = 'post',
  Recap = 'recap',
  Release = 'release',
}

type Attributes = ClientDoc & {
  /**
  uuid-v7, which can be generated with `npx -y uuid v7`
  */
  id: string;
  title: string;
  description: string;
  featured?: boolean;
  authors: string[];
  coverUrl?: string;
  coverSrcset?: string;
  coverWidth?: number;
  coverHeight?: number;
  coverAlt?: string;
  coverAttribution?: string;
  url: string;
  type: BlogType;
};

export type SerializedPost = Attributes & {
  publishedAt: string;
  modifiedAt?: string;
};

export type BlogPost = Attributes & {
  publishedAt: DateTime;
  modifiedAt?: DateTime;
};
