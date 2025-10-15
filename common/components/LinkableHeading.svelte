<script lang="ts">
  import { cleanClass } from '$common';
  import { Heading } from '@immich/ui';
  import type { ComponentProps, Snippet } from 'svelte';

  type Props = {
    id: string;
    children: Snippet;
  } & ComponentProps<typeof Heading>;

  const handleCopy = async (id: string) => {
    const text = `${window.location.origin}${window.location.pathname}#${id}`;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const { children, id, class: className, ...props }: Props = $props();
</script>

<a href="#{id}" class={cleanClass('group flex gap-1', className)} onclick={() => handleCopy(id)}>
  <Heading {...props} {id}>
    {@render children()}
    <span class="hidden group-hover:inline-block">#</span>
  </Heading>
</a>
