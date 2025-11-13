<script lang="ts">
  import ApiParamsInternal from '$lib/components/ApiParamsInternal.svelte';
  import { withExtensions } from '$lib/services/open-api';
  import type { SchemaObject } from '$lib/services/open-api.d';

  type Props = {
    schema: SchemaObject;
  };

  const { schema }: Props = $props();

  let params = $derived(
    schema.properties
      ? Object.entries(schema.properties).map(([name, property]) => {
          const { state, history } = withExtensions(property);
          return {
            name,
            description: (property as SchemaObject)?.description,
            type: property,
            required: schema.required?.includes(name),
            state,
            history,
          };
        })
      : undefined,
  );
</script>

{#if params}
  <ApiParamsInternal {params} />
{/if}
