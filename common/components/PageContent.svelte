<script lang="ts">
  import { SiteFooter } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string;
  };

  let { children, class: className }: Props = $props();
</script>

<div  class="flex flex-col h-full mx-auto">
  <div class="grow {className ? className : ''}">
    <div class="w-full h-full p-4 md:p-6 lg:p-8">
      {@render children?.()}
    </div>
  </div>
  <SiteFooter />
</div>
