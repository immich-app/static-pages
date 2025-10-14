<script lang="ts">
  import type { ReferenceObject } from '$lib/services/open-api.d';
  import { getOpenApi, getRefHref, getRefName } from '$lib/services/open-api';
  import { Link, Text } from '@immich/ui';

  type Props = {
    ref: ReferenceObject;
  };

  const { ref }: Props = $props();

  const { fromRef } = getOpenApi();
</script>

{#if fromRef(ref)}
  <span class="rounded-lg bg-pink-200 px-2 py-1 dark:bg-pink-900 dark:text-pink-50">
    <Link href={getRefHref(ref)}>{getRefName(ref)}</Link>
  </span>
{:else}
  <Text>Unable to find schema for ref: {ref.$ref}</Text>
{/if}
