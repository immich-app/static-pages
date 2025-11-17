<script lang="ts">
  import { cleanClass } from '$common';
  import ApiState from '$lib/components/ApiState.svelte';
  import { getEndpointColor, type ApiEndpointTag } from '$lib/services/open-api';
  import { Button, Card, CardTitle, Heading, Text } from '@immich/ui';

  type Props = {
    tag: ApiEndpointTag;
  };

  const { tag }: Props = $props();
</script>

<div>
  <div class="py-4">
    <Heading class="mb-0.5 flex items-center gap-2">
      <a href={tag.href}>{tag.name}</a>
    </Heading>
    {#if tag.description}
      <Text color="muted" class="mb-1">{tag.description}</Text>
    {/if}
  </div>
  <Card color="secondary">
    {#each tag.endpoints as endpoint, i (i)}
      <Button href={endpoint.href} shape="rectangle" color="secondary" fullWidth variant="ghost" class="p-4">
        <div class="flex w-full flex-col {endpoint.deprecated ? 'text-gray-500' : ''}">
          <div class="flex justify-between">
            <div>
              <CardTitle>
                <span class={cleanClass(getEndpointColor(endpoint), 'font-bold')}>{endpoint.method}</span>
                <span>{endpoint.route}</span>
              </CardTitle>
              <Text class="flex gap-1 truncate" color="muted">
                <span class="group flex justify-between gap-2">{endpoint.summary || endpoint.description || ''}</span>
              </Text>
            </div>
            <div class="flex flex-col items-end gap-1">
              <Text color="muted" size="large">{endpoint.operationId}</Text>
              {#if endpoint.state}
                <ApiState state={endpoint.state} />
              {/if}
            </div>
          </div>
        </div>
      </Button>
    {/each}
  </Card>
</div>
