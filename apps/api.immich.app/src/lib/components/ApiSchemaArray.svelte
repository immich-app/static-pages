<script lang="ts">
  import type { ReferenceObject, SchemaObject } from '$lib/services/open-api.d';
  import { getRefHref, getRefName, isRef } from '$lib/services/open-api';
  import { Link, Text } from '@immich/ui';

  type Props = {
    schema: SchemaObject | ReferenceObject;
  };

  const { schema }: Props = $props();
</script>

{#if isRef(schema)}
  <span class="rounded-lg bg-pink-200 px-2 py-1 dark:bg-pink-900 dark:text-pink-50">
    <Link href={getRefHref(schema)}>{getRefName(schema)}[]</Link>
  </span>
{:else}
  <Text>{schema.format ?? schema.type}[]</Text>
{/if}
