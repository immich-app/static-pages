<script lang="ts">
  import type { LiveCounts } from '$lib/types';

  interface Props {
    counts: LiveCounts;
  }

  let { counts }: Props = $props();
</script>

<div class="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-600">
  <span class="pulse-dot inline-block h-2 w-2 rounded-full bg-green-500"></span>
  {#if counts.activeRespondents > 0}
    <span class="text-gray-400">
      <span class="font-medium text-green-400">{counts.activeRespondents}</span> responding
    </span>
  {/if}
  {#if counts.activeViewers > 0}
    <span class="text-gray-400">
      <span class="font-medium text-gray-300">{counts.activeViewers}</span> viewing
    </span>
  {/if}
  {#if counts.activeViewers === 0 && counts.activeRespondents === 0}
    <span class="text-gray-500">Live</span>
  {/if}
</div>
