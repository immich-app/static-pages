<script lang="ts">
  import Heading from '$lib/components/Heading/Heading.svelte';
  import type { HeadingTag, Size } from '$lib/types.js';
  import type { Snippet } from 'svelte';

  type Props = {
    id?: string;
    level?: number;
    children: Snippet;
  };

  const { children, id, level }: Props = $props();

  const getSizeAndTag = (level?: number): { size: Size; tag: HeadingTag; class: string } => {
    switch (level) {
      case 1: {
        return { size: 'giant', tag: 'h1', class: 'mt-8 mb-3' };
      }
      case 2: {
        return { size: 'large', tag: 'h2', class: 'mt-6 mb-3' };
      }
      case 3: {
        return { size: 'medium', tag: 'h3', class: 'mt-4 mb-3' };
      }
      case 4: {
        return { size: 'small', tag: 'h4', class: 'my-3' };
      }
      case 5: {
        return { size: 'tiny', tag: 'h5', class: 'my-3' };
      }
      default: {
        return { size: 'tiny', tag: 'p', class: '' };
      }
    }
  };

  let { size, tag, class: className } = $derived(getSizeAndTag(level));
</script>

<Heading {size} {tag} class={className} {id} {children} />
