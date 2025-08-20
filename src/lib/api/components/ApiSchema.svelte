<script lang="ts">
  import ApiSchemaEnum from '$lib/api/components/ApiSchemaEnum.svelte';
  import ApiSchemaObject from '$lib/api/components/ApiSchemaObject.svelte';
  import ApiSchemaRef from '$lib/api/components/ApiSchemaRef.svelte';
  import ApiSchemaType from '$lib/api/components/ApiSchemaType.svelte';
  import { isRef } from '$lib/api/services/open-api';
  import type { ReferenceObject, SchemaObject } from '$lib/api/services/open-api.d';

  type Props = {
    schema?: SchemaObject | ReferenceObject;
  };

  const { schema: target }: Props = $props();

  const schema = $derived(target as SchemaObject);
</script>

{#if isRef(target)}
  <ApiSchemaRef ref={target} />
{/if}

{#if schema.enum}
  <ApiSchemaEnum enum={schema.enum} />
{/if}

{#if schema.type === 'object'}
  <ApiSchemaObject {schema} />
{/if}

{#if schema.type === 'array' && schema.items}
  <ApiSchemaType {schema} />
{/if}
