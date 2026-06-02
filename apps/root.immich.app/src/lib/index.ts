import { goto } from '$app/navigation';
import { defaultProvider, type ActionItem } from '@immich/ui';
import fm from 'front-matter';
import { DateTime } from 'luxon';

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

type Attributes = {
  /** uuid-v7, which can be generated with `npx -y uuid v7` */
  id: string;
  title: string;
  description: string;
  draft?: boolean;
  featured?: boolean;
  authors: string[];
  coverUrl?: string;
  coverAlt?: string;
  coverAttribution?: string;
};

// keep in sync with blog/(type) folders
export enum BlogType {
  Announcement = 'announcement',
  Post = 'post',
  Recap = 'recap',
  Release = 'release',
}

export const isBlogType = (value: string | BlogType): value is BlogType => {
  return Object.values(BlogType).includes(value as BlogType);
};

export const typeToLabel = (type: BlogType) => capitalize(type);

export type BlogPost = Attributes & {
  publishedAt: DateTime;
  modifiedAt?: DateTime;
  url: string;
  type: BlogType;
};

type PostFrontMatter = Attributes & {
  publishedAt: Date;
  modifiedAt?: Date;
};

const getFrontMatterExample = (missingAttributes: string[]) => {
  return [
    '---',
    ...Object.entries({
      id: 'your-uuid-v7-here',
      title: 'Your post title',
      description: 'A brief description of your post',
      publishedAt: '2025-10-01',
      authors: '[Author 1, Author 2]',
    })
      .filter(([key]) => missingAttributes.includes(key))
      .map(([key, value]) => `${key}: ${value}`),
    '---',
  ].join('\n');
};

const asPost = (path: string, attributes: PostFrontMatter): BlogPost => {
  const parts = path.split('/');
  const filename = parts.at(-2)!;
  const folder = parts.at(-3)!;
  const type = folder.slice(1, -2); // strip parens and trailing s

  const requiredAttributes = ['id', 'title', 'description', 'publishedAt', 'authors'];
  const missingAttributes = requiredAttributes.filter((attribute) => !(attribute in attributes));
  if (missingAttributes.length > 0) {
    throw new Error(
      `${filename} is missing ${missingAttributes.join(', ')}.\n${getFrontMatterExample(missingAttributes)}`,
    );
  }

  if (!isBlogType(type)) {
    throw new Error(
      `${filename} has incorrect blog type - found ${type}, but expected one of ${Object.values(BlogType).join(', ')}`,
    );
  }

  return {
    id: attributes.id,
    title: attributes.title,
    description: attributes.description,
    publishedAt: DateTime.fromJSDate(attributes.publishedAt, { zone: 'UTC' }) as DateTime<true>,
    modifiedAt: attributes.modifiedAt
      ? (DateTime.fromJSDate(attributes.modifiedAt, { zone: 'UTC' }) as DateTime<true>)
      : undefined,
    authors: attributes.authors,
    url: `/blog/${filename}`,
    draft: attributes.draft === true,
    featured: attributes.featured,
    coverUrl: attributes.coverUrl,
    coverAlt: attributes.coverAlt,
    coverAttribution: attributes.coverAttribution,
    type,
  };
};

const getPosts = () => {
  const idMap = new Map<string, string>();
  const modules = import.meta.glob<{ default: string }>('../routes/blog/**/*.md', { query: '?raw', eager: true });
  const posts: BlogPost[] = [];
  for (const [path, { default: content }] of Object.entries(modules)) {
    const post = asPost(path, fm<PostFrontMatter>(content).attributes);

    if (idMap.has(post.id)) {
      throw new Error(
        `Detected a duplicate blog ID! ${post.id} is used in ${path} and ${idMap.get(post.id)}. Hint: use pnpm uuid to generate a new uuid-v7`,
      );
    }

    idMap.set(post.id, path);

    if (post.publishedAt < DateTime.now().minus({ years: 1 }) && post.title.endsWith(' recap')) {
      post.title = post.title.replaceAll(' recap', ` ${post.publishedAt.year} recap`);
    }

    posts.push(post);
  }

  return posts.toSorted((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf());
};

export const posts: BlogPost[] = getPosts();

export const getBlogProvider = () => {
  const commands: ActionItem[] = posts.map((post) => ({
    title: post.title,
    description: `${post.publishedAt.toLocaleString(DateTime.DATE_MED)} — ${post.description}`,
    extraText: post.url,
    tags: [typeToLabel(post.type)],
    onAction: () => goto(post.url),
  }));

  return defaultProvider({ name: 'Posts', types: ['blog', 'blogs', 'post', 'posts'], actions: commands });
};
