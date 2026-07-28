<script lang="ts">
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import { tv } from 'tailwind-variants';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();

  const isReleaseNotePage = $derived(!!page.route.id?.includes('releases'));

  const styles = tv({
    base: 'mx-auto',
    variants: {
      releaseNotes: {
        true: 'max-w-3xl',
        false: 'max-w-2xl',
      },
    },
  });
</script>

<div class={styles({ releaseNotes: isReleaseNotePage })}>
  {@render children?.()}
</div>
