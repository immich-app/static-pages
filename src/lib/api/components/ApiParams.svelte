<script lang="ts">
  import ApiSchemaType from '$lib/api/components/ApiSchemaType.svelte';
  import type { ParameterObject } from '$lib/api/services/open-api.d';
  import { Card, Code } from '@immich/ui';

  type Props = {
    params: ParameterObject[];
  };

  const { params }: Props = $props();
</script>

<Card color="secondary">
  <div class="grid grid-cols-12 py-2 px-4 font-bold bg-subtle text-dark mb-2 border-b">
    <div class="col-span-3">Property</div>
    <div class="col-span-3">Type</div>
    <div class="col-span-3">Required</div>
    <div class="col-span-3">Description</div>
  </div>
  {#each params as param, i (i)}
    <div class="grid grid-cols-12 py-2 px-4">
      <div class="col-span-3">
        <Code>{param.name}</Code>
      </div>
      <div class="col-span-3">
        {#if param.schema}
          <ApiSchemaType schema={param.schema} />
        {/if}
      </div>
      <div class="col-span-3">
        {#if param.required}
          <span
            class="py-1 px-2 dark:bg-red-900 dark:text-red-50 bg-red-200 text-muted rounded-lg"
            title="Param is required">Required</span
          >
        {/if}
      </div>
      <div class="col-span-3">{param.description}</div>
    </div>
  {/each}
</Card>
