<script lang="ts">
  import { page } from '$app/state';
  import PageContent from '$lib/components/PageContent.svelte';
  import type { Snippet } from 'svelte';
  import { tv } from 'tailwind-variants';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();

  const isIndexPage = $derived(page.route.id === '/(shell)/blog');

  const styles = tv({
    base: 'mx-auto w-full',
    variants: {
      index: {
        true: 'max-w-2xl',
        false: '',
      },
    },
  });
</script>

<PageContent>
  <div class={styles({ index: isIndexPage })}>
    {@render children?.()}
  </div>
</PageContent>
