<script lang="ts">
  import ApiNextSteps from '$lib/api/components/ApiNextSteps.svelte';
  import { Heading, Stack, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    description: string;
    nextSteps?: Array<{ href: string; title: string }>;
    children?: Snippet;
  };

  const { title, description, nextSteps = [], children }: Props = $props();
</script>

<Stack gap={8}>
  <div class="flex justify-between place-items-end">
    <div class="flex flex-col gap-2">
      <Heading size="giant" tag="h1">{title}</Heading>
      <Text color="muted" size="giant" fontWeight="bold">{description}</Text>
    </div>
  </div>

  <hr class="border border-subtle" />

  {@render children?.()}

  {#if nextSteps.length > 0}
    <ApiNextSteps {nextSteps} />
  {/if}
</Stack>
