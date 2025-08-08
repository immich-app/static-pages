<script lang="ts">
  import ApiTagSummary from '$lib/components/ApiTagSummary.svelte';
  import { Button, Heading, Stack } from '@immich/ui';
  import { type PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const tag = $derived(data.tag);
</script>

<Stack gap={4}>
  <div class="flex justify-between items-center">
    <Heading size="giant">API Endpoints</Heading>
    <Button href="/api/endpoints" color="secondary">View All</Button>
  </div>

  <ApiTagSummary {tag} />
</Stack>
