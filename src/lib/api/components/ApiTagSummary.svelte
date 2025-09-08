<script lang="ts">
  import { resolve } from '$app/paths';
  import { getEndpointColor, type ApiEndpointTag } from '$lib/api/services/open-api';
  import { Button, Card, CardTitle, Heading, Text } from '@immich/ui';

  type Props = {
    tag: ApiEndpointTag;
  };

  const { tag }: Props = $props();
</script>

<div>
  <Heading class="flex gap-2 py-4 items-center">
    <a href={resolve(tag.href)}>{tag.name}</a>
  </Heading>
  <Card color="secondary">
    {#each tag.endpoints as endpoint, i (i)}
      <Button href={endpoint.href} shape="rectangle" color="secondary" fullWidth variant="ghost" class="p-4">
        <div class="flex flex-col w-full">
          <CardTitle>
            <span class="group flex gap-2 justify-between {endpoint.deprecated ? 'text-gray-500 italic' : ''}">
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
