<script lang="ts">
  import { getOpenApi, getTagEndpointHref } from '$lib/services/open-api.svelte';
  import { getIcon } from '$lib/utils/icons';
  import { Card, CardBody, CardHeader, CardTitle, Heading, Icon, Link, Stack } from '@immich/ui';

  const { tags } = getOpenApi();
</script>

<Stack gap={8}>
  <Heading size="large" tag="h1">API Endpoints</Heading>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
    {#each tags as tag}
      <Card color="secondary">
        <CardHeader>
          <CardTitle class="flex gap-2 items-center">
            <Icon icon={getIcon(tag.name)} />
            <Link href={tag.href}>{tag.name}</Link>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap={1}>
            {#each tag.endpoints as endpoint}
              <Link href={getTagEndpointHref(tag, endpoint)} class="no-underline hover:underline"
                >{endpoint.method} {endpoint.route}</Link
              >
            {/each}
          </Stack>
        </CardBody>
      </Card>
    {/each}
  </div>
</Stack>
