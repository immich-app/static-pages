<script lang="ts">
  import { Button, Card, Heading, HStack } from '@immich/ui';
  import { mdiPencilOutline, mdiXml } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { HighlightSvelte, LineNumbers } from 'svelte-highlight';
  import atomOneDark from 'svelte-highlight/styles/atom-one-dark';

  type Props = {
    code: string;
    children: Snippet;
  };

  const { children, code }: Props = $props();

  let viewMode = $state<'children' | 'code'>('children');
  const handleToggle = () => {
    viewMode = viewMode === 'children' ? 'code' : 'children';
  };
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html atomOneDark}
</svelte:head>

<Card>
  <div class="flex justify-between items-center p-4">
    <Heading size="medium">docker-compose.yaml</Heading>
    <HStack gap={1} class="lg:border rounded-xl p-1">
      <Button
        leadingIcon={mdiPencilOutline}
        disabled={viewMode === 'children'}
        onclick={handleToggle}
        size="small"
        class={viewMode === 'children' ? 'hidden md:flex' : ''}
        >Configure
      </Button>
      <Button
        leadingIcon={mdiXml}
        disabled={viewMode === 'code'}
        onclick={handleToggle}
        size="small"
        class={viewMode === 'code' ? 'hidden md:flex' : ''}>View</Button
      >
    </HStack>
  </div>
  <div class={viewMode === 'children' ? 'px-4 pb-4' : ''}>
    {#if viewMode === 'children'}
      {@render children()}
    {:else}
      <HighlightSvelte code={code.trim().replaceAll(/\t/gm, '  ')} let:highlighted>
        <LineNumbers {highlighted} hideBorder wrapLines />
      </HighlightSvelte>
    {/if}
  </div>
</Card>
