<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { getOpenApi } from '$lib/api/services/open-api';
  import '$lib/app.css';
  import { ApiPage } from '$lib/utils/api';
  import {
    asText,
    CommandPalette,
    commandPaletteManager,
    initializeTheme,
    onThemeChange,
    siteCommands,
    Theme,
    theme,
  } from '@immich/ui';
  import { mdiApi, mdiScriptText, mdiSend, mdiTag, mdiTagMultiple } from '@mdi/js';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  initializeTheme({ selector: 'body' });

  let pathname = '';
  onMount(() => {
    pathname = page.url.pathname;
  });

  beforeNavigate(() => {
    const newPathname = $state.snapshot(page.url.pathname);
    pathname = newPathname;
  });

  afterNavigate(() => {
    const newPathname = $state.snapshot(page.url.pathname);
    if (pathname === newPathname) {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  const handleToggleTheme = () => {
    theme.value = theme.value === Theme.Dark ? Theme.Light : Theme.Dark;
    onThemeChange();
  };

  const { tags, models } = getOpenApi();

  commandPaletteManager.reset();

  for (const tag of tags) {
    commandPaletteManager.addCommands({
      icon: mdiTagMultiple,
      iconClass: 'text-pink-700 dark:text-pink-200',
      type: 'Tag',
      title: tag.name,
      href: tag.href,
      text: asText(tag.name),
    });

    for (const endpoint of tag.endpoints) {
      commandPaletteManager.addCommands({
        icon: mdiApi,
        type: 'Endpoint',
        iconClass: 'text-indigo-700 dark:text-indigo-200',
        title: endpoint.operationId,
        description: endpoint.description,
        href: endpoint.href,
        text: asText(endpoint.operationId, endpoint.name, endpoint.description),
      });
    }
  }

  for (const model of models) {
    commandPaletteManager.addCommands({
      icon: mdiTag,
      iconClass: 'text-violet-700 dark:text-violet-200',
      type: 'Model',
      title: model.name,
      description: model.description,
      href: model.href,
      text: asText(model.name, model.title, model.description),
    });
  }

  commandPaletteManager.addCommands(
    [
      {
        title: 'Introduction',
        description: 'Overview of Immich API',
        href: ApiPage.Introduction,
        text: asText('introduction'),
      },
      {
        title: 'Getting Started',
        description: 'Learn how to get started with Immich API',
        href: ApiPage.GettingStarted,
        text: asText('getting', 'started'),
      },
      {
        title: 'Authentication',
        description: 'Learn how authentication works in the Immich API',
        href: ApiPage.Authentication,
        text: asText('authentication', 'authorization'),
      },
      {
        title: 'Permissions',
        description: 'Learn how permissions work with the Immich API',
        href: ApiPage.Permissions,
        text: asText('permissions'),
      },
      {
        title: 'SDK',
        description: 'Learn about the @immich/sdk generated client',
        href: ApiPage.Sdk,
        text: asText('@immich/sdk'),
      },
      {
        title: 'Endpoints',
        description: 'A list of all the endpoints in the Immich API',
        href: ApiPage.Endpoints,
        text: asText('overview', 'endpoints'),
      },
      {
        title: 'Models',
        description: 'A list of all the models in the Immich API',
        href: ApiPage.Models,
        text: asText('overview', 'models'),
      },
    ].map((item) => ({
      icon: mdiScriptText,
      iconClass: 'text-teal-800 dark:text-teal-200',
      type: 'Page',
      ...item,
    })),
  );

  commandPaletteManager.addCommands(
    [
      {
        title: 'Toggle theme',
        description: 'Toggle between light and dark theme',
        action: () => handleToggleTheme(),
        text: asText('theme', 'toggle', 'dark', 'light'),
      },
    ].map((item) => ({
      icon: mdiSend,
      iconClass: 'text-purple-800 dark:text-purple-200',
      type: 'Action',
      ...item,
    })),
  );

  commandPaletteManager.addCommands(siteCommands);

  commandPaletteManager.enable();
</script>

<CommandPalette />

{@render children?.()}
