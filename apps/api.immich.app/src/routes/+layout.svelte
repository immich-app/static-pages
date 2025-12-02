<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { ApiPage } from '$lib';
  import '$lib/app.css';
  import ErrorLayout from '$lib/components/ErrorLayout.svelte';
  import { getOpenApi } from '$lib/services/open-api';
  import {
    asText,
    CommandPaletteContext,
    commandPaletteManager,
    initializeTheme,
    onThemeChange,
    siteCommands,
    Theme,
    theme,
    type ActionItem,
  } from '@immich/ui';
  import { mdiApi, mdiScriptText, mdiSend, mdiTag, mdiTagMultiple } from '@mdi/js';
  import { type Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  initializeTheme({ selector: 'body' });

  const handleToggleTheme = () => {
    theme.value = theme.value === Theme.Dark ? Theme.Light : Theme.Dark;
    onThemeChange();
  };

  commandPaletteManager.enable();

  const commands = $state<ActionItem[]>([]);

  try {
    const { tags, models } = getOpenApi();

    for (const tag of tags) {
      commands.push({
        icon: mdiTagMultiple,
        iconClass: 'text-pink-700 dark:text-pink-200',
        type: 'Tag',
        title: tag.name,
        onAction: () => goto(tag.href),
      });

      for (const endpoint of tag.endpoints) {
        commands.push({
          icon: mdiApi,
          type: 'Endpoint',
          iconClass: 'text-indigo-700 dark:text-indigo-200',
          title: endpoint.operationId,
          description: endpoint.description,
          onAction: () => goto(endpoint.href),
          searchText: asText(endpoint.operationId, endpoint.name, endpoint.description),
        });
      }
    }

    for (const model of models) {
      commands.push({
        icon: mdiTag,
        iconClass: 'text-violet-700 dark:text-violet-200',
        type: 'Model',
        title: model.name,
        description: model.description,
        onAction: () => goto(model.href),
        searchText: asText(model.name, model.title, model.description),
      });
    }
  } catch {
    // noop
  }

  commands.push(
    ...[
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
    ].map(({ href, ...item }) => ({
      icon: mdiScriptText,
      iconClass: 'text-teal-800 dark:text-teal-200',
      type: 'Page',
      onAction: () => goto(href),
      ...item,
    })),
    ...[
      {
        title: 'Toggle theme',
        description: 'Toggle between light and dark theme',
        onAction: () => handleToggleTheme(),
        searchText: asText('theme', 'toggle', 'dark', 'light'),
      },
    ].map((item) => ({
      icon: mdiSend,
      iconClass: 'text-purple-800 dark:text-purple-200',
      type: 'Action',
      ...item,
    })),
    ...siteCommands,
  );
</script>

<CommandPaletteContext {commands} />

{#if page.data.error}
  <ErrorLayout error={page.data.error}></ErrorLayout>
{:else}
  {@render children?.()}
{/if}
