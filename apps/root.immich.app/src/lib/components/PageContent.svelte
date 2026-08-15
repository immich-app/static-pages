<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cleanClass } from '$common';

  type Props = {
    children?: Snippet;
    class?: string;
  };

  const { children, class: className }: Props = $props();
</script>

<div class={cleanClass('grow', className)}>
  <div class="size-full w-full p-4 md:p-6 lg:p-8">
    {@render children?.()}
  </div>
</div>
