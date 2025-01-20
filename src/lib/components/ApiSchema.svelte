<script lang="ts">
  import ApiSchemaArray from '$lib/components/ApiSchemaArray.svelte';
  import ApiSchemaEnum from '$lib/components/ApiSchemaEnum.svelte';
  import ApiSchemaObject from '$lib/components/ApiSchemaObject.svelte';
  import ApiSchemaRef from '$lib/components/ApiSchemaRef.svelte';
  import type { ReferenceObject, SchemaObject } from '$lib/services/open-api';
  import { isRef } from '$lib/services/open-api.svelte';
  import { Code } from '@immich/ui';

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

{#if schema.format === 'uuid'}
  <Code>{schema.format}</Code>
{/if}

{#if schema.type === 'object'}
  <ApiSchemaObject {schema} />
{/if}

{#if schema.type === 'array' && schema.items}
  <ApiSchemaArray schema={schema.items} />
{/if}
