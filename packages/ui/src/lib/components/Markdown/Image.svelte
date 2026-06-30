<script lang="ts">
  import { cleanClass } from '$lib/utilities/internal.js';
  import type { Snippet } from 'svelte';

  type Props = {
    src: string;
    alt?: string;
    caption?: Snippet;
    title?: string;
    class?: string;
  };

  const { src, alt, caption, title, class: className }: Props = $props();
</script>

<figure class="my-3">
  <img {src} {alt} {title} class={cleanClass('rounded-lg border object-cover', className)} />
  {#if caption || alt}
    <figcaption class="text-muted p-1 text-center text-sm italic">
      {#if typeof caption === 'function'}
        {@render caption()}
      {:else}
        {caption ?? alt}
      {/if}
    </figcaption>
  {/if}
</figure>
