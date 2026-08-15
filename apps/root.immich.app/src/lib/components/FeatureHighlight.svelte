<script lang="ts">
  import { cleanClass } from '$common';
  import FeatureContainer from '$lib/components/FeatureContainer.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    label: Snippet;
    media: Snippet;
    reverse?: boolean;
  };

  const { reverse = false, label, media }: Props = $props();
</script>

<FeatureContainer color={reverse ? 'secondary' : 'primary'} class="flex flex-col gap-12 lg:grid lg:grid-cols-2">
  <div class={cleanClass(reverse ? 'lg:order-2' : '', 'col-span-1 my-auto')}>
    {@render label?.()}
  </div>
  <div class="flex items-center justify-around overflow-hidden align-middle">
    {@render media?.()}
  </div>
</FeatureContainer>
