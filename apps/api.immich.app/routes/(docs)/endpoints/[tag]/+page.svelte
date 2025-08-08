<script lang="ts">
  import ApiTagSummary from '$lib/api/components/ApiTagSummary.svelte';
  import { Text, Button, Heading, Stack, Icon } from '@immich/ui';
  import { type PageData } from './$types';
  import { ApiPage } from '$lib/utils/api';
  import { mdiArrowLeft, mdiArrowRight } from '@mdi/js';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const tag = $derived(data.tag);
</script>

<Stack gap={4}>
  <div class="flex justify-between items-center">
    <Heading size="giant">API Endpoints</Heading>
    <Button href={ApiPage.Endpoints} color="secondary">View All</Button>
  </div>

  <ApiTagSummary {tag} />

  <Stack gap={4}>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {#if tag.previous}
        <Button href={tag.previous.href} size="giant" fullWidth color="secondary" variant="outline">
          <Stack gap={2} class="w-full">
            <Text size="small">Previous</Text>
            <div class="flex items-center gap-2">
              <Icon icon={mdiArrowLeft} />
              <Text>{tag.previous.name}</Text>
            </div>
          </Stack>
        </Button>
      {:else}
        <span></span>
      {/if}

      {#if tag.next}
        <Button href={tag.next.href} size="giant" fullWidth color="secondary" variant="outline">
          <div class="w-full flex flex-col place-items-end">
            <Text size="small">Next</Text>
            <div class="flex items-center gap-2">
              <Text>{tag.next.name}</Text>
              <Icon icon={mdiArrowRight} />
            </div>
          </div>
        </Button>
      {:else}
        <span></span>
      {/if}
    </div>
  </Stack>
</Stack>
