import { BlogType, type BlogPost, type SerializedPost } from '$lib/types';
import type { ClientDoc } from '@immich/svelte-markdown-preprocess';
import { DateTime } from 'luxon';
import { getDocs } from 'virtual:docs';

export const siteMetadata = {
  title: 'Immich',
  description:
    'Self-hosted photo and video management solution. Easily back up, organize, and manage your photos on your own server. Immich helps you browse, search and organize your photos and videos with ease, without sacrificing your privacy.',
  imageUrl: '/img/social-preview.png',
};

export const blogMetadata = {
  title: 'Immich Blog',
  description: 'Latest updates, announcements, and stories from the Immich team.',
};

export type TimelineItem = {
  icon: string;
  iconClass?: string;
  title: string;
  description?: string;
  link?: { href: string; text: string };
  done?: false;
  getDateLabel: (language: string) => string;
};

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export { BlogType } from '$lib/types';
export type { BlogPost, SerializedPost } from '$lib/types';

export const isBlogType = (value: string | BlogType): value is BlogType => {
  return Object.values(BlogType).includes(value as BlogType);
};

export const typeToLabel = (type: BlogType) => capitalize(type);

const asDateTime = (value: string) => DateTime.fromISO(value, { zone: 'UTC' }) as DateTime<true>;

const asTitle = ({ title, publishedAt }: BlogPost) => {
  if (publishedAt < DateTime.now().minus({ years: 1 }) && title.endsWith(' recap')) {
    return title.replaceAll(' recap', () => ` ${publishedAt.year} recap`);
  }

  return title;
};

export const asBlogPost = (post: SerializedPost): BlogPost => {
  const blogPost = {
    ...post,
    publishedAt: asDateTime(post.publishedAt),
    modifiedAt: post.modifiedAt ? asDateTime(post.modifiedAt) : undefined,
  };

  return { ...blogPost, title: asTitle(blogPost) };
};

const isPost = (doc: ClientDoc): doc is SerializedPost => 'type' in doc;

export const posts: BlogPost[] = getDocs<SerializedPost | ClientDoc>()
  .filter((doc) => isPost(doc))
  .map((doc) => asBlogPost(doc))
  .toSorted((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf());
