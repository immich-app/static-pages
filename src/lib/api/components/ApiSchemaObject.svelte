<script lang="ts">
  import ApiSchemaType from '$lib/api/components/ApiSchemaType.svelte';
  import type { SchemaObject } from '$lib/api/services/open-api.d';
  import { Card, Code } from '@immich/ui';

  type Props = {
    schema: SchemaObject;
  };

  const { schema }: Props = $props();
</script>

{#if schema.properties}
  <Card color="secondary">
    <div class="grid grid-cols-12 py-2 px-4 font-bold bg-subtle text-dark mb-2">
      <div class="col-span-3">Property</div>
      <div class="col-span-3">Type</div>
      <div class="col-span-3">Required</div>
      <div class="col-span-3">Description</div>
    </div>
    {#each Object.entries(schema.properties) as [name, property], i (i)}
      <div class="grid grid-cols-12 py-2 px-4">
        <div class="col-span-3">
          <Code>{name}</Code>
        </div>
        <div class="col-span-3">
          <ApiSchemaType schema={property} />
        </div>
        <div class="col-span-3">
          {#if schema.required?.includes(name)}
            <span
              class="py-1 px-2 dark:bg-red-900 dark:text-red-50 bg-red-200 text-muted rounded-lg"
              title="Param is required">Required</span
            >
          {/if}
        </div>
        <div class="col-span-3">{(property as SchemaObject)?.description}</div>
      </div>
    {/each}
  </Card>
{/if}
