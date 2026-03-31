<script lang="ts">
  import type { Tag } from '$lib/api/tags';

  interface Props {
    tags: Tag[];
    selectedTagId: string;
    onSelect: (tagId: string) => void;
  }

  let { tags, selectedTagId, onSelect }: Props = $props();
</script>

{#if tags.length > 0}
  <div class="flex flex-wrap items-center gap-2">
    <button
      class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTagId === ''
        ? 'bg-immich-primary text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}"
      onclick={() => onSelect('')}
    >
      All
    </button>
    {#each tags as tag (tag.id)}
      <button
        class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTagId === tag.id
          ? 'bg-immich-primary text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}"
        onclick={() => onSelect(tag.id)}
      >
        {#if tag.color}
          <span class="mr-1 inline-block h-2 w-2 rounded-full" style="background-color: {tag.color}"></span>
        {/if}
        {tag.name}
      </button>
    {/each}
  </div>
{/if}
