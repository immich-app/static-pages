import { blogMetadata } from '$lib';
import { posts } from '$lib/blog';
import { Feed } from 'feed';
import { DateTime } from 'luxon';

export const feed = new Feed({
  title: blogMetadata.title,
  description: blogMetadata.description,
  id: 'https://immich.app/blog',
  link: 'https://immich.app/blog',
  language: 'en',
  copyright: `Copyright © ${DateTime.now().year} FUTO. All rights reserved.`,
  favicon: 'https://immich.app/favicon.ico',
});

for (const post of posts) {
  feed.addItem({
    title: post.title,
    id: post.id,
    link: 'https://immich.app' + post.url,
    description: post.description,
    author: post.authors.map((author) => ({ name: author })),
    date: (post.modifiedAt ?? post.publishedAt).toJSDate(),
    published: post.publishedAt.toJSDate(),
  });
}
