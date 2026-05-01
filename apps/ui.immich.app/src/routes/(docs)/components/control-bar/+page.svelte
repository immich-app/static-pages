<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import ComponentTipCard from '$lib/components/ComponentTipCard.svelte';
  import { Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import VariantExample from './VariantExample.svelte';
  import variantExample from './VariantExample.svelte?raw';
</script>

<ComponentPage name="ControlBar" description="A component for displaying a control bar at the top of the page">
  <ComponentTipCard>
    <Text>See <ComponentLink name="ActionBar" /> for an action-based control bar.</Text>
  </ComponentTipCard>
  <ComponentExamples
    examples={[
      { title: 'Basic', code: basicExample, component: BasicExample },
      { title: 'Variant', code: variantExample, component: VariantExample },
    ]}
  />
</ComponentPage>
