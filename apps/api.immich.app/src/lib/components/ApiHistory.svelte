<script lang="ts">
  import ApiState from '$lib/components/ApiState.svelte';
  import type { HistoryItem } from '$lib/services/open-api.d';
  import { Code, Markdown } from '@immich/ui';

  type Props = {
    history: HistoryItem[];
  };

  const { history }: Props = $props();
</script>

{#if history}
  <Markdown.List>
    {#each history.toReversed() as item, i (i)}
      <Markdown.ListItem>
        <Code>{item.version}</Code> &mdash;
        {#if item.state === 'Added' || item.state === 'Updated'}
          {item.state}
        {:else}
          Marked as <ApiState state={item.state} />
        {/if}
      </Markdown.ListItem>
    {/each}
  </Markdown.List>
{/if}
