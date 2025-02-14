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
