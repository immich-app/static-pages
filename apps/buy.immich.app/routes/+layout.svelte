<script lang="ts">
  import '$lib/app.css';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

{@render children?.()}
