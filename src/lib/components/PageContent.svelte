<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();
</script>

<section class="flex flex-col h-full">
  <div class="grow">
    <div class="w-full h-full md:max-w-screen-lg px-4 py-10 sm:px-20 lg:p-10 m-auto">
      {@render children?.()}
    </div>
  </div>
  <Footer />
</section>
