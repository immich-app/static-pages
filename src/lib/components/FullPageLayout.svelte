<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import { Scrollable, syncToDom } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();

  $effect(() => {
    syncToDom();
  });
</script>

<Scrollable>
  <section class="flex flex-col h-dvh">
    <div class="grow">
      <div class="w-full h-full md:max-w-screen-md p-4 sm:p-8 lg:p-10 m-auto">
        {@render children?.()}
      </div>
    </div>
    <Footer />
  </section>
</Scrollable>
