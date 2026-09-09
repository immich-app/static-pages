<script lang="ts">
  import GithubLink from '$lib/components/GithubLink/GithubLink.svelte';
  import Link from '$lib/components/Link/Link.svelte';
  import { parseGithubLink } from '$lib/utilities/common.js';
  import type { Snippet } from 'svelte';

  type Props = {
    href: string;
    title?: string;
    children?: Snippet;
  };

  const { href, title, children }: Props = $props();

  const github = $derived(parseGithubLink(href));
</script>

{#if github}
  <GithubLink {...github} {title} />
{:else}
  <Link {href} {title} {children} />
{/if}
