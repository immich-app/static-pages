<script lang="ts">
  import { PUBLIC_IMMICH_SPEC_URL } from '$env/static/public';
  import ApiNextSteps from '$lib/api/components/ApiNextSteps.svelte';
  import { getOpenApi } from '$lib/api/services/open-api';
  import { Heading, Text, Stack, Link } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    description: string;
    nextSteps?: Array<{ href: string; title: string }>;
    children?: Snippet;
  };

  const { title, description, nextSteps = [], children }: Props = $props();

  const { info } = getOpenApi();
</script>

<Stack gap={8}>
  <div class="flex justify-between place-items-end">
    <div class="flex flex-col gap-2 mt-8">
      <Heading size="title" tag="h1">{title}</Heading>
      <Text color="muted" size="giant" fontWeight="bold">{description}</Text>
    </div>
    <Text color="muted" size="giant" fontWeight="bold">
      <Link href={PUBLIC_IMMICH_SPEC_URL}>v{info.version}</Link>
    </Text>
  </div>

  <hr class="border border-subtle" />

  {@render children?.()}

  {#if nextSteps.length > 0}
    <ApiNextSteps {nextSteps} />
  {/if}
</Stack>
