import { DateTime } from 'luxon';
import { PUBLIC_IMMICH_ENV } from '$env/static/public';

export type BlogPost = {
  title: string;
  description: string;
  publishedAt: DateTime;
  authors: string[];
  url: string;
  isDraft?: boolean;
};

export const Posts = {
  ImmichUi: {
    title: 'Immich publishes a Svelte component library',
    description: 'Learn more about the Svelte component library that is powering this and other Immich websites.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 9, day: 30 }),
    authors: ['Jason Rasmussen'],
    url: '/blog/immich-ui',
  },
  CursedKnowledge: {
    title: 'Cursed knowledge',
    description:
      "The story behind the Cursed Knowledge page and how we gained the knowledge we have that we wish we didn't.",
    publishedAt: DateTime.fromObject({ year: 2025, month: 9, day: 23 }),
    authors: ['Jason Rasmussen'],
    url: '/blog/cursed-knowledge',
  },
  ImmichApi: {
    title: 'Immich publishes new API documentation',
    description: 'The Immich API documentation has been moved to a new home.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 9, day: 23 }),
    authors: ['Jason Rasmussen'],
    url: '/blog/immich-api-documentation',
  },
  ImmichStore: {
    title: 'Immich launches merch',
    description: 'The Immich merch store is now live! Get your swag today, and learn about our new mascot, Mich.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 2, day: 27 }),
    authors: ['Zack Pollard', 'Jason Rasmussen'],
    url: '/blog/immich-merch',
  },
  YearInReview2024: {
    title: '2024 - A year in review',
    description: 'A review of the major milestones and accomplishments in 2024.',
    publishedAt: DateTime.fromObject({ year: 2024, month: 12, day: 30 }),
    authors: ['Alex Tran'],
    url: '/blog/2024-year-in-review',
  },
  PurchaseImmich: {
    title: 'Immich introduces product keys',
    description: 'Purchase a product key to support Immich development, FUTO, and open source software.',
    publishedAt: DateTime.fromObject({ year: 2024, month: 7, day: 18 }),
    authors: ['Alex Tran', 'Jason Rasmussen'],
    url: '/blog/immich-product-keys',
  },
  ImmichJoinsFuto: {
    title: 'Immich joins FUTO',
    description: 'The core team goes full-time on Immich as part of FUTO.',
    publishedAt: DateTime.fromObject({ year: 2024, month: 5, day: 1 }),
    authors: ['Alex Tran'],
    url: '/blog/immich-joins-futo',
  },
  YearInReview2023: {
    title: '2023 - A year in review',
    description: 'A review of the major milestones and accomplishments in 2023.',
    publishedAt: DateTime.fromObject({ year: 2023, month: 12, day: 30 }),
    authors: ['Alex Tran'],
    url: '/blog/2023-year-in-review',
  },
} satisfies Record<string, BlogPost>;

export const posts: BlogPost[] = (Object.values(Posts) as BlogPost[])
  .sort((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf())
  .filter((post) => PUBLIC_IMMICH_ENV === 'development' || (post.publishedAt <= DateTime.now() && !post.isDraft));
