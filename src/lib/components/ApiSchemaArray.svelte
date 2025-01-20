<script lang="ts">
  import type { ReferenceObject, SchemaObject } from '$lib/services/open-api';
  import { getRefHref, getRefName, isRef } from '$lib/services/open-api.svelte';
  import { Link, Text } from '@immich/ui';

  type Props = {
    schema: SchemaObject | ReferenceObject;
  };

  const { schema }: Props = $props();
</script>

{#if isRef(schema)}
  <Link href={getRefHref(schema)}>{getRefName(schema)}</Link>[]
{:else}
  <Text>{schema.format ?? schema.type}[]</Text>
{/if}
