import { defaultProvider, linkCommands, type ActionProvider } from '@immich/ui';
import items from '../data/items.json';

export const siteMetadata = {
  title: 'Awesome Immich',
  description: 'A list of awesome Immich apps, integrations, tools, distributions, and guides',
  imageUrl: '/img/social-preview.png',
  editUrl: 'https://github.com/immich-app/static-pages/blob/main/apps/awesome.immich.app/README.md#adding-projects',
};

export type Category = {
  id: string;
  name: string;
  projects: Project[];
};

export type Project = {
  title: string;
  description: string;
  href: string;
};

export const categories = items;

export const getCategoryProviders = () => {
  const providers: ActionProvider[] = Array.from(categories, (category) =>
    defaultProvider({
      name: category.name,
      types: category.types,
      actions: linkCommands(category.projects),
    }),
  );

  return providers;
};
