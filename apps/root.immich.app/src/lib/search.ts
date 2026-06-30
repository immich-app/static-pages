import { defaultProvider, navigateTo } from '@immich/ui';

export type SearchDoc = {
  title: string;
  description: string;
  tags: string[];
  url: string;
  text: string;
};

export const getSearchProvider = (docs: SearchDoc[]) => {
  return defaultProvider({
    name: 'Blog',
    types: ['blog'],
    actions: docs.map((doc) => ({
      title: doc.title,
      description: doc.description,
      tags: doc.tags,
      text: doc.text,
      onAction: () => navigateTo(doc.url),
    })),
  });
};
