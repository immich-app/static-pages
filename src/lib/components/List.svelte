<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();
</script>

<ul class="list-disc ps-6 flex flex-col gap-1">
  {@render children?.()}
</ul>
