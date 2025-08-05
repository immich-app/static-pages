<script lang="ts">
  import ApiSchemaArray from '$lib/components/ApiSchemaArray.svelte';
  import ApiSchemaRef from '$lib/components/ApiSchemaRef.svelte';
  import type { SchemaObject } from '$lib/services/open-api.d';
  import { isRef } from '$lib/services/open-api';
  import { Code } from '@immich/ui';

  type Props = {
    schema: SchemaObject;
  };

  const { schema: target }: Props = $props();

  const schema = $derived(target as SchemaObject);
</script>

{#if schema.properties}
  <div class="bg-subtle rounded-xl text-sm">
    <div class="grid grid-cols-12 py-2 px-4 font-bold">
      <div class="col-span-3">Property</div>
      <div class="col-span-3">Type</div>
      <div class="col-span-3">Required</div>
      <div class="col-span-3">Description</div>
    </div>
    <hr class="border-b border" />
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
              <Code>{property?.format ?? property?.type}</Code>
              {#if property.type === 'array'}
                <span>[]</span>
              {/if}
            {/if}
          </div>
          <div class="col-span-3">
            <Code>{(schema.required || []).includes(name)}</Code>
          </div>
          <div class="col-span-3">{property.description}</div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
