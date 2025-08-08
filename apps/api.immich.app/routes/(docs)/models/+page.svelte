<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import { getOpenApi } from '$lib/api/services/open-api';
  import { Card, CardTitle } from '@immich/ui';

  const { models } = getOpenApi();
</script>

<ApiPageContent title="API Models" description="An overview of all the available API models">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
    {#each models as model (model.href)}
      <a href={model.href}>
        <Card color="secondary" class="">
          <CardTitle class="p-4">{model.name}</CardTitle>
        </Card>
      </a>
    {/each}
  </div>
</ApiPageContent>
