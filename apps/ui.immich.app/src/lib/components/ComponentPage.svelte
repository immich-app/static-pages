<script lang="ts">
  import { Markdown, type ContainerSize } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    name: string;
    description: string;
    descriptionBody?: Snippet;
    size?: ContainerSize;
    children?: Snippet;
  };

  const { size, name, description, descriptionBody, children }: Props = $props();
</script>

<Markdown.Page attributes={{ title: name, description }} description={descriptionBody} {size} {children} />
