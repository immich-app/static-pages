<script lang="ts">
  import ApiParamsInternal from '$lib/components/ApiParamsInternal.svelte';
  import type { SchemaObject } from '$lib/services/open-api.d';

  type Props = {
    schema: SchemaObject;
  };

  const { schema }: Props = $props();

  let params = $derived(
    schema.properties
      ? Object.entries(schema.properties).map(([name, property]) => ({
          name,
          description: (property as SchemaObject)?.description,
          type: property,
          required: schema.required?.includes(name),
        }))
      : undefined,
  );
</script>

{#if params}
  <ApiParamsInternal {params} />
{/if}
