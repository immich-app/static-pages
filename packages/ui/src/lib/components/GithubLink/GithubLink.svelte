<script lang="ts">
  import Link from '$lib/components/Link/Link.svelte';
  import type { GithubLinkProps } from '$lib/types.js';
  import { asGithubLink } from '$lib/utilities/common.js';

  const { org, repo, number, type, ...rest }: GithubLinkProps = $props();
  const { href, text } = $derived(asGithubLink({ org, repo, number, type }));
</script>

<Link {...rest} {href} class="inline-flex items-center">{text}</Link>
