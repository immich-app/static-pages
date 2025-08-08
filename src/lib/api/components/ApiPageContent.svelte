<script lang="ts">
  import ApiNextSteps from '$lib/api/components/ApiNextSteps.svelte';
  import { Heading, Text, Stack } from '@immich/ui';
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
  <div class="flex flex-col gap-2 mt-8">
    <Heading size="title" tag="h1">{title}</Heading>
    <Text color="muted" size="giant" fontWeight="bold">{description}</Text>
  </div>

  {@render children?.()}

  {#if nextSteps.length > 0}
    <ApiNextSteps {nextSteps} />
  {/if}
</Stack>
