<script lang="ts">
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
    type CommandItem,
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

  const commands = $state<CommandItem[]>([]);

  try {
    const { tags, models } = getOpenApi();

    for (const tag of tags) {
      commands.push({
        icon: mdiTagMultiple,
        iconClass: 'text-pink-700 dark:text-pink-200',
        type: 'Tag',
        title: tag.name,
        href: tag.href,
        text: asText(tag.name),
      });

      for (const endpoint of tag.endpoints) {
        commands.push({
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
      commands.push({
        icon: mdiTag,
        iconClass: 'text-violet-700 dark:text-violet-200',
        type: 'Model',
        title: model.name,
        description: model.description,
        href: model.href,
        text: asText(model.name, model.title, model.description),
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
        text: asText('introduction'),
      },
      {
        title: 'Getting started',
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
    ...[
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
    ...siteCommands,
  );
</script>

<CommandPaletteContext {commands} />

{#if page.data.error}
  <ErrorLayout error={page.data.error}></ErrorLayout>
{:else}
  {@render children?.()}
{/if}
