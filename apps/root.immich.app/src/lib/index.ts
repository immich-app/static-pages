import { PUBLIC_IMMICH_ENV } from '$env/static/public';
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
  link?: { url: string; text: string };
  done?: false;
  getDateLabel: (language: string) => string;
};

export type BlogPost = {
  /** uuid-v7, which can be generated with `npx -y uuid v7` */
  id: string;
  title: string;
  description: string;
  publishedAt: DateTime;
  modifiedAt?: DateTime;
  authors: string[];
  url: string;
  draft?: boolean;
};

type PostFrontMatter = {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  modifiedAt?: Date;
  draft?: boolean;
  authors: string[];
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

const asPost = (filename: string, attributes: PostFrontMatter) => {
  const requiredAttributes = ['id', 'title', 'description', 'publishedAt', 'authors'];
  const missingAttributes = requiredAttributes.filter((attr) => !(attr in attributes));
  if (missingAttributes.length > 0) {
    throw new Error(
      `${filename} is missing ${missingAttributes.join(', ')}.\n${getFrontMatterExample(missingAttributes)}`,
    );
  }

  return {
    id: attributes.id,
    title: attributes.title,
    description: attributes.description,
    publishedAt: DateTime.fromJSDate(attributes.publishedAt) as DateTime<true>,
    modifiedAt: attributes.modifiedAt ? (DateTime.fromJSDate(attributes.modifiedAt) as DateTime<true>) : undefined,
    authors: attributes.authors,
    url: `/blog/${filename}`,
    draft: attributes.draft === true,
  };
};

const getPosts = () => {
  const idMap = new Map<string, string>();
  const modules = import.meta.glob<{ default: string }>('../routes/blog/**/*.md', { query: '?raw', eager: true });
  const posts: BlogPost[] = [];
  for (const [path, { default: content }] of Object.entries(modules)) {
    const post = asPost(path.split('/').at(-2)!, fm<PostFrontMatter>(content).attributes);

    if (idMap.has(post.id)) {
      throw new Error(
        `Detected a duplicate blog ID! ${post.id} is used in ${path} and ${idMap.get(post.id)}. Hint: use pnpm uuid to generate a new uuid-v7`,
      );
    }

    idMap.set(post.id, path);

    if (PUBLIC_IMMICH_ENV === 'development' || (post.publishedAt <= DateTime.now() && !post.draft)) {
      posts.push(post);
    }
  }

  return posts.sort((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf());
};

export const posts: BlogPost[] = getPosts();
