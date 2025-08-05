<script lang="ts">
  import { getOpenApi } from '$lib/services/open-api';
  import { Card, CardTitle, Heading, Stack } from '@immich/ui';

  const { models } = getOpenApi();
</script>

<Stack gap={8}>
  <Heading size="large" tag="h1">Models</Heading>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
    {#each models as model (model.href)}
      <a href={model.href}>
        <Card color="secondary" class="">
          <CardTitle class="p-4">{model.name}</CardTitle>
        </Card>
      </a>
    {/each}
  </div>
</Stack>
