<script lang="ts">
  import { Container, Scrollable, SiteFooter, type Size } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    size?: Size | 'full';
    center?: boolean;
  };

  const { size, children }: Props = $props();
</script>

<Scrollable>
  <section class="flex flex-col h-dvh">
    <div class="grow">
      <Container {size} center class="p-4 sm:p-8 lg:p-10">
        {@render children?.()}
      </Container>
    </div>
    <SiteFooter />
  </section>
</Scrollable>
