<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();
</script>

<div class="max-w-2xl mx-auto">
  {@render children?.()}
</div>
