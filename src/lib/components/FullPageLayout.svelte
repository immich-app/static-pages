<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import { Scrollable, syncToDom } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    width?: 'sm' | 'md' | 'lg';
  };

  const { width = 'md', children }: Props = $props();

  const maxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
  };

  const widthClass = $derived(maxWidths[width]);

  $effect(() => {
    syncToDom();
  });
</script>

<Scrollable>
  <section class="flex flex-col h-dvh">
    <div class="grow">
      <div class="w-full h-full p-4 sm:p-8 lg:p-10 m-auto {widthClass}">
        {@render children?.()}
      </div>
    </div>
    <Footer />
  </section>
</Scrollable>
