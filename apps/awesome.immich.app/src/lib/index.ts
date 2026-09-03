import { defaultProvider, linkCommands, type ActionProvider } from '@immich/ui';
import { orderBy } from 'lodash-es';
import { z } from 'zod';
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

export enum ProjectTag {
  Official = 'Official',
  Unmaintained = 'Unmaintained',
  VibeCoded = 'Vibe-Coded',
}

export const projectSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    websiteUrl: z.string().optional(),
    sourceCodeUrl: z.string().optional(),
    tags: z.array(z.enum(ProjectTag)).default([]),
  })
  .refine(({ websiteUrl, sourceCodeUrl }) => !!(websiteUrl ?? sourceCodeUrl), {
    error: 'A project requires a websiteUrl, a sourceCodeUrl, or both',
  });

export type Project = z.infer<typeof projectSchema>;

export const getProjectUrl = ({ websiteUrl, sourceCodeUrl }: Project) => websiteUrl ?? sourceCodeUrl!;

export const categories = items.map((category) => ({
  ...category,
  projects: orderBy(
    category.projects.map((project) => projectSchema.parse(project)),
    [
      (project) => project.tags.includes(ProjectTag.Official),
      (project) => !project.tags.includes(ProjectTag.Unmaintained),
    ],
    ['desc', 'desc'],
  ),
}));

export const getCategoryProviders = () => {
  const providers: ActionProvider[] = Array.from(categories, (category) =>
    defaultProvider({
      name: category.name,
      types: category.types,
      actions: linkCommands(
        category.projects.map((project) => ({
          title: project.title,
          description: project.description,
          href: getProjectUrl(project),
        })),
      ),
    }),
  );

  return providers;
};
