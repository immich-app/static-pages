<script lang="ts">
  import { IMAGE_SIZES_QUERY } from '$lib/utilities/image-sizes.js';
  import { cleanClass } from '$lib/utilities/internal.js';
  import type { Snippet } from 'svelte';

  type Props = {
    src: string;
    srcset?: string;
    width?: number | string;
    height?: number | string;
    alt?: string;
    caption?: Snippet;
    title?: string;
    class?: string;
    priority?: boolean;
  };

  const { src, srcset, width, height, alt, caption, title, class: className, priority }: Props = $props();
</script>

<figure class="my-3">
  <img
    {src}
    {srcset}
    sizes={srcset ? IMAGE_SIZES_QUERY : undefined}
    {width}
    {height}
    {alt}
    {title}
    loading={priority ? 'eager' : 'lazy'}
    fetchpriority={priority ? 'high' : undefined}
    class={cleanClass('rounded-lg object-cover block max-w-full max-h-[80vh] w-auto h-auto mx-auto', className)}
  />
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
