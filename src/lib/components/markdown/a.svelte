<script lang="ts">
  import { Link } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    href: string;
    title?: string;
    children?: Snippet;
  };

  const { href, title, children }: Props = $props();
</script>

<Link {href} {title} {children} />
