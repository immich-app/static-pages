<script lang="ts">
  import { ApiPage } from '$lib';
  import ApiTagSummary from '$lib/components/ApiTagSummary.svelte';
  import { Button, type CommandItem, CommandPaletteContext, Heading, Icon, Stack, Text } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight } from '@mdi/js';
  import { type PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const tag = $derived(data.tag);
</script>

{#key tag.name}
  <CommandPaletteContext
    commands={[
      tag.previous && {
        icon: mdiArrowLeft,
        title: 'Previous tag',
        type: 'Navigation',
        iconClass: '',
        text: 'previous',
        href: tag.previous.href,
        shortcuts: { key: 'ArrowLeft' },
      },
      tag.next && {
        icon: mdiArrowRight,
        title: 'Next tag',
        type: 'Navigation',
        iconClass: '',
        text: 'next',
        href: tag.next.href,
        shortcuts: { key: 'ArrowRight' },
      },
    ].filter(Boolean) as CommandItem[]}
  />
{/key}

<Stack gap={4}>
  <div class="flex items-center justify-between">
    <Heading size="giant">API Endpoints</Heading>
    <Button href={ApiPage.Endpoints} color="secondary">View All</Button>
  </div>

  <ApiTagSummary {tag} />

  <Stack gap={4}>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {#if tag.previous}
        <Button href={tag.previous.href} size="giant" fullWidth color="secondary" variant="outline">
          <Stack gap={2} class="w-full">
            <Text size="small">Previous</Text>
            <div class="flex items-center gap-2">
              <Icon icon={mdiArrowLeft} />
              <Text>{tag.previous.name}</Text>
            </div>
          </Stack>
        </Button>
      {:else}
        <span></span>
      {/if}

      {#if tag.next}
        <Button href={tag.next.href} size="giant" fullWidth color="secondary" variant="outline">
          <div class="flex w-full flex-col place-items-end">
            <Text size="small">Next</Text>
            <div class="flex items-center gap-2">
              <Text>{tag.next.name}</Text>
              <Icon icon={mdiArrowRight} />
            </div>
          </div>
        </Button>
      {:else}
        <span></span>
      {/if}
    </div>
  </Stack>
</Stack>
