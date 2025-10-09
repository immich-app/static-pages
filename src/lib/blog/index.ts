import { DateTime } from 'luxon';
import { PUBLIC_IMMICH_ENV } from '$env/static/public';

export type BlogPost = {
  /** uuid-v7, which can be generated with `npx -y uuid v7` */
  id: string;
  title: string;
  description: string;
  publishedAt: DateTime;
  modifiedAt?: DateTime;
  authors: string[];
  url: string;
  isDraft?: boolean;
};

export const Posts = {
  StableRelease: {
    id: '0199ca17-0cf1-768e-83f8-3049b22212ec',
    title: 'Stable release',
    description: 'Read about the Immich v2.0.0 stable release and what it means for you.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 10, day: 9 }),
    authors: ['Alex Tran', 'Jason Rasmussen', 'Zack Pollard'],
    url: '/blog/stable-release',
  },
  ImmichUi: {
    id: '0199bf43-cfec-769c-95a8-2ff1c9774fb0',
    title: 'New Svelte component library',
    description: 'Learn more about the Svelte component library that is powering this and other Immich websites.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 9, day: 25 }),
    authors: ['Jason Rasmussen'],
    url: '/blog/immich-ui',
  },
  NewSyncImplementation: {
    id: '0199bf43-a42d-75e8-9cab-06041f89ed14',
    title: 'Sync v2',
    description: 'Learn how Immich developed a better way to synchronize data with the mobile app.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 9, day: 24 }),
    authors: ['Jason Rasmussen'],
    url: '/blog/sync-v2',
  },
  CursedKnowledge: {
    id: '0199bf43-7a22-7778-a514-2db731e3c99d',
    title: 'Cursed knowledge',
    description:
      "The story behind the Cursed Knowledge page and how we gained the knowledge we have that we wish we didn't.",
    publishedAt: DateTime.fromObject({ year: 2025, month: 9, day: 23 }),
    authors: ['Jason Rasmussen'],
    url: '/blog/cursed-knowledge',
  },
  ImmichApi: {
    id: '0199bf43-5985-714c-8e5c-aa94e65a0176',
    title: 'New API documentation',
    description: 'The Immich API documentation has been moved to a new home.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 9, day: 23 }),
    authors: ['Jason Rasmussen'],
    url: '/blog/immich-api-documentation',
  },
  ImmichStore: {
    id: '0199bf43-3627-71fe-9747-35d71cb778eb',
    title: 'Immich launches merch',
    description: 'The Immich merch store is now live! Get your swag today, and learn about our new mascot, Mich.',
    publishedAt: DateTime.fromObject({ year: 2025, month: 2, day: 27 }),
    authors: ['Zack Pollard', 'Jason Rasmussen'],
    url: '/blog/immich-merch',
  },
  YearInReview2024: {
    id: '0199bf43-0a6d-720b-ba24-cb6e8277693e',
    title: '2024 - A year in review',
    description: 'A review of the major milestones and accomplishments in 2024.',
    publishedAt: DateTime.fromObject({ year: 2024, month: 12, day: 30 }),
    authors: ['Alex Tran'],
    url: '/blog/2024-year-in-review',
  },
  PurchaseImmich: {
    id: '0199bf42-e615-76ad-8bf5-351584cc59c1',
    title: 'Immich introduces product keys',
    description: 'Purchase a product key to support Immich development, FUTO, and open source software.',
    publishedAt: DateTime.fromObject({ year: 2024, month: 7, day: 18 }),
    authors: ['Alex Tran', 'Jason Rasmussen'],
    url: '/blog/immich-product-keys',
  },
  ImmichJoinsFuto: {
    id: '0199bf42-bd9c-7461-86a7-2487f13b6e8b',
    title: 'Immich joins FUTO',
    description: 'The core team goes full-time on Immich as part of FUTO.',
    publishedAt: DateTime.fromObject({ year: 2024, month: 5, day: 1 }),
    authors: ['Alex Tran'],
    url: '/blog/immich-joins-futo',
  },
  YearInReview2023: {
    id: '0199bf42-8ee2-70cd-b6ad-02222625932b',
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
