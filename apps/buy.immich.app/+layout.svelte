<script lang="ts">
  import '$lib/app.css';
  import Footer from '$lib/components/footer.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<section class="flex flex-col w-screen h-screen overflow-auto">
  <div class="grow">
    {@render children?.()}
  </div>
  <Footer />
</section>
