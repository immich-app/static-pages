import { defaultProvider, linkCommands } from '@immich/ui';
import {
  mdiAccountMultipleOutline,
  mdiAccountOutline,
  mdiAlertOutline,
  mdiBellBadgeOutline,
  mdiBookshelf,
  mdiCheckAll,
  mdiCloudDownloadOutline,
  mdiCodeJson,
  mdiFaceMan,
  mdiFileChartOutline,
  mdiFileMultipleOutline,
  mdiForumOutline,
  mdiImageAlbum,
  mdiImageMultipleOutline,
  mdiImageOutline,
  mdiKeyOutline,
  mdiMagnify,
  mdiMap,
  mdiMovieRoll,
  mdiSecurity,
  mdiServerOutline,
  mdiSync,
  mdiTagMultipleOutline,
  mdiTimelineOutline,
  mdiTrashCanOutline,
} from '@mdi/js';

export enum ApiPage {
  Introduction = '/introduction',
  GettingStarted = '/getting-started',
  Authentication = '/authentication',
  Permissions = '/permissions',
  Sdk = '/sdk',
  Endpoints = '/endpoints',
  Models = '/models',
}

const icons: Record<string, string> = {
  'API Keys': mdiKeyOutline,
  Activities: mdiForumOutline,
  Albums: mdiImageAlbum,
  Audit: mdiCheckAll,
  Assets: mdiImageOutline,
  Authentication: mdiSecurity,
  Deprecated: mdiAlertOutline,
  Duplicates: mdiFileMultipleOutline,
  Download: mdiCloudDownloadOutline,
  Faces: mdiFaceMan,
  'File Reports': mdiFileChartOutline,
  Jobs: mdiSync,
  Libraries: mdiBookshelf,
  Map: mdiMap,
  Memories: mdiMovieRoll,
  Notifications: mdiBellBadgeOutline,
  OAuth: mdiSecurity,
  Partners: mdiAccountMultipleOutline,
  People: mdiAccountOutline,
  Search: mdiMagnify,
  Server: mdiServerOutline,
  Stacks: mdiImageMultipleOutline,
  Sync: mdiSync,
  Tags: mdiTagMultipleOutline,
  Timeline: mdiTimelineOutline,
  Trash: mdiTrashCanOutline,
  Users: mdiAccountMultipleOutline,
  'Users (admin)': mdiAccountMultipleOutline,
};

export const getIcon = (name: string) => icons[name] || mdiCodeJson;

export const getPageProvider = () => {
  return defaultProvider({
    name: 'Pages',
    types: ['page', 'pages'],
    actions: linkCommands([
      {
        title: 'Introduction',
        description: 'Overview of Immich API',
        href: ApiPage.Introduction,
      },
      {
        title: 'Getting started',
        description: 'Learn how to get started with Immich API',
        href: ApiPage.GettingStarted,
      },
      {
        title: 'Authentication',
        description: 'Learn how authentication works in the Immich API',
        href: ApiPage.Authentication,
      },
      {
        title: 'Permissions',
        description: 'Learn how permissions work with the Immich API',
        href: ApiPage.Permissions,
      },
      {
        title: 'SDK',
        description: 'Learn about the @immich/sdk generated client',
        href: ApiPage.Sdk,
      },
      {
        title: 'Endpoints',
        description: 'A list of all the endpoints in the Immich API',
        href: ApiPage.Endpoints,
      },
      {
        title: 'Models',
        description: 'A list of all the models in the Immich API',
        href: ApiPage.Models,
      },
    ]),
  });
};
