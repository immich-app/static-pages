// place files you want to import through the `$lib` alias in this folder.

export enum StorageKey {
  INSTANCE_URL = 'immich-instance-url',
}

export type Fetch = typeof fetch;

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
