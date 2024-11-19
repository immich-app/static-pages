<script lang="ts">
  import '$lib/app.css';
  import Footer from '$lib/components/footer.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<section class="w-screen h-screen overflow-auto grid grid-rows-[auto_60px] lg:h-screen">
  {@render children?.()}
  <Footer />
</section>
