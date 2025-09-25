<script lang="ts">
  import type { ReferenceObject, SchemaObject } from '$lib/api/services/open-api.d';
  import { getRefHref, getRefName, isRef } from '$lib/api/services/open-api';
  import { Link, Text } from '@immich/ui';

  type Props = {
    schema: SchemaObject | ReferenceObject;
  };

  const { schema }: Props = $props();
</script>

{#if isRef(schema)}
  <span class="py-1 px-2 dark:bg-pink-900 dark:text-pink-50 bg-pink-200 rounded-lg">
    <Link href={getRefHref(schema)}>{getRefName(schema)}[]</Link>
  </span>
{:else}
  <Text>{schema.format ?? schema.type}[]</Text>
{/if}
