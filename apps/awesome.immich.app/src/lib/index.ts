import { defaultProvider, linkCommands, type ActionProvider } from '@immich/ui';
import items from '../data/items.json';

export const siteMetadata = {
  title: 'Awesome Immich',
  description: 'A list of awesome Immich apps, integrations, tools, distributions, and guides',
  imageUrl: '/img/social-preview.png',
  editUrl: 'https://github.com/immich-app/static-pages/edit/main/apps/awesome.immich.app/src/data/items.json',
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
  const providers: ActionProvider[] = [];

  for (const category of categories) {
    providers.push(
      defaultProvider({
        name: category.name,
        types: category.types,
        actions: linkCommands(category.projects),
      }),
    );
  }

  return providers;
};
