<script lang="ts">
  import type { ReferenceObject } from '$lib/api/services/open-api.d';
  import { getOpenApi, getRefHref, getRefName } from '$lib/api/services/open-api';
  import { Link, Text } from '@immich/ui';

  type Props = {
    ref: ReferenceObject;
  };

  const { ref }: Props = $props();

  const { fromRef } = getOpenApi();
</script>

{#if fromRef(ref)}
  <span class="py-1 px-2 dark:bg-pink-900 dark:text-pink-50 bg-pink-200 rounded-lg">
    <Link href={getRefHref(ref)}>{getRefName(ref)}</Link>
  </span>
{:else}
  <Text>Unable to find schema for ref: {ref.$ref}</Text>
{/if}
