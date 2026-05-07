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
        return { size: 'giant', tag: 'h1', class: 'my-6' };
      }
      case 2: {
        return { size: 'large', tag: 'h2', class: 'my-5' };
      }
      case 3: {
        return { size: 'medium', tag: 'h3', class: 'my-3' };
      }
      case 4: {
        return { size: 'small', tag: 'h4', class: 'my-2' };
      }
      case 5: {
        return { size: 'tiny', tag: 'h5', class: 'my-1' };
      }
      default: {
        return { size: 'tiny', tag: 'p', class: '' };
      }
    }
  };

  let { size, tag, class: className } = $derived(getSizeAndTag(level));
</script>

<Heading {size} {tag} class={className} {id} {children} />
