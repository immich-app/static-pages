<script lang="ts">
  import { Code } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    lang?: string;
  };

  const { children, lang }: Props = $props();
</script>

<Code>
  <p>({lang})</p>
  {@render children()}
</Code>
