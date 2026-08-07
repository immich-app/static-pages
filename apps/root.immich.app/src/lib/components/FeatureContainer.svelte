<script lang="ts">
  import { cleanClass } from '$common';
  import PageContent from '$lib/components/PageContent.svelte';
  import { Container, type ContainerSize } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    color?: 'primary' | 'secondary';
    class?: string;
    size?: ContainerSize;
  };

  const { size = 'large', color = 'secondary', class: className, children }: Props = $props();
</script>

<PageContent class={cleanClass(color === 'secondary' ? 'bg-light' : 'bg-primary-100')}>
  <Container {size} center>
    <div class={cleanClass('my-8 lg:h-112 lg:my-0', className)}>
      {@render children?.()}
    </div>
  </Container>
</PageContent>
