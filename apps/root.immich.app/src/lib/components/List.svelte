<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();
</script>

<ul class="flex list-disc flex-col gap-1 ps-6">
  {@render children?.()}
</ul>
