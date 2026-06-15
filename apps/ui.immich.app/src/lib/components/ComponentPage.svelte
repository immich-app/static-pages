<script lang="ts">
  import MarkdownPage from '$lib/components/MarkdownPage.svelte';
  import { type ContainerSize } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    name: string;
    description: string;
    localeSensitive?: boolean;
    size?: ContainerSize;
    children?: Snippet;
  };

  const { size, name, localeSensitive = false, description, children }: Props = $props();
</script>

<MarkdownPage attributes={{ title: name, description }} {localeSensitive} {size} {children} />
