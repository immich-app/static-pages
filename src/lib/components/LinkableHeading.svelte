<script lang="ts">
  import { cleanClass } from '$lib/utils';
  import { Heading } from '@immich/ui';
  import type { ComponentProps } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type Props = {
    href: string;
    children: Snippet;
    anchorProps?: Omit<HTMLAnchorAttributes, 'href'>;
  } & ComponentProps<typeof Heading>;

  const { children, class: className, anchorProps, href, ...props }: Props = $props();
</script>

<a {...anchorProps} {href} class={cleanClass('group flex gap-1', className)}>
  <Heading {...props}>
    {@render children()}
    <span class="hidden group-hover:inline-block">#</span>
  </Heading>
</a>
