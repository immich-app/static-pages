<script lang="ts">
  import ApiSchemaArray from '$lib/api/components/ApiSchemaArray.svelte';
  import ApiSchemaRef from '$lib/api/components/ApiSchemaRef.svelte';
  import type { SchemaObject } from '$lib/api/services/open-api.d';
  import { isRef } from '$lib/api/services/open-api';
  import { Card, CardBody, CardHeader, Code } from '@immich/ui';

  type Props = {
    schema: SchemaObject;
  };

  const { schema: target }: Props = $props();

  const schema = $derived(target as SchemaObject);
</script>

{#if schema.properties}
  <Card color="secondary">
    <div class="grid grid-cols-12 py-2 px-4 font-bold bg-dark text-light mb-2">
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
        {#if isRef(property)}
          <div class="col-span-9">
            <ApiSchemaRef ref={property} />
          </div>
        {:else}
          <div class="col-span-3">
            {#if property.items}
              <ApiSchemaArray schema={property.items} />
            {:else}
              {#if property.type === 'string' && !property.format}
                <span class="py-1 px-2 dark:bg-yellow-900 dark:text-yellow-50 bg-yellow-200 text-muted rounded-lg"
                  >String
                </span>
              {:else if property.format === 'date-time'}
                <span class="py-1 px-2 dark:bg-blue-900 dark:text-blue-50 bg-blue-200 text-muted rounded-lg"
                  >DateTime
                </span>
              {:else if property.type === 'boolean'}
                <span class="py-1 px-2 dark:bg-green-900 dark:text-green-50 bg-green-200 text-muted rounded-lg"
                  >Boolean
                </span>
              {:else if property.type === 'integer'}
                <span class="py-1 px-2 dark:bg-purple-900 dark:text-purple-50 bg-purple-200 text-muted rounded-lg">
                  Number {property.format ? `(${property.format})` : ''}
                </span>
              {:else if property.type || property.format}
                <span class="py-1 px-2 dark:bg-pink-900 dark:text-pink-50 bg-pink-200 text-muted rounded-lg">
                  <pre>{JSON.stringify(property)}</pre>
                  {property.format ?? property.type}
                </span>
              {:else}
                <!-- <pre>{JSON.stringify(property)}</pre> -->
              {/if}
              {#if property.type === 'array'}
                <span>[]</span>
              {/if}
            {/if}
          </div>
          <div class="col-span-3">
            {#if schema.required?.includes(name)}
              <span
                class="py-1 px-2 dark:bg-red-900 dark:text-red-50 bg-red-200 text-muted rounded-lg"
                title="Param is required">Required</span
              >
            {/if}
          </div>
          <div class="col-span-3">{property.description}</div>
        {/if}
      </div>
    {/each}
  </Card>
{/if}
