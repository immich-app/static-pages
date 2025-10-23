<script lang="ts">
  import { getEndpointColor, type ApiEndpointTag } from '$lib/services/open-api';
  import { Button, Card, CardTitle, Heading, Text } from '@immich/ui';

  type Props = {
    tag: ApiEndpointTag;
  };

  const { tag }: Props = $props();
</script>

<div>
  <Heading class="flex items-center gap-2 py-4">
    <a href={tag.href}>{tag.name}</a>
  </Heading>
  <Card color="secondary">
    {#each tag.endpoints as endpoint, i (i)}
      <Button href={endpoint.href} shape="rectangle" color="secondary" fullWidth variant="ghost" class="p-4">
        <div class="flex w-full flex-col">
          <CardTitle>
            <span class="group flex justify-between gap-2 {endpoint.deprecated ? 'text-gray-500 italic' : ''}">
              <span class="flex gap-2">
                <span class={getEndpointColor(endpoint)}>{endpoint.method}</span>
                <span>{endpoint.route}</span>
              </span>
              <span class="text-muted hidden md:inline-block">{endpoint.operationId}</span>
            </span>
          </CardTitle>
          {#if endpoint.description}
            <Text color="muted" class="truncate">{endpoint.description}</Text>
          {/if}
        </div>
      </Button>
    {/each}
  </Card>
</div>
