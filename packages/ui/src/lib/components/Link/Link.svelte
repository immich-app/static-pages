<script lang="ts">
  import type { LinkProps } from '$lib/types.js';
  import { isExternalLink, resolveUrl } from '$lib/utilities/common.js';
  import { cleanClass } from '$lib/utilities/internal.js';

  const { href, class: className, underline = true, children, ...restProps }: LinkProps = $props();

  let resolved = $derived(resolveUrl(href));
  let external = $derived(isExternalLink(resolved));
</script>

<a
  href={resolved}
  draggable="false"
  class={cleanClass(
    underline && 'underline',
    'rounded-xs outline-primary outline-offset-1 focus-visible:outline-2',
    className,
  )}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener noreferrer' : undefined}
  {...restProps}
>
  {#if children}
    {@render children()}
  {:else}
    {href}
  {/if}
</a>
