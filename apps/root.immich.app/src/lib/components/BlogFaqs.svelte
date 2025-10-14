<script lang="ts">
  import { Heading, Stack } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();
</script>

<Stack gap={2} class="text-lg">
  <hr class="my-6" />
  <Heading tag="h2" size="giant" id="faqs">FAQs</Heading>
  {@render children?.()}
</Stack>
