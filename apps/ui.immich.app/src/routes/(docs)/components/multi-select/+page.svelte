<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentFieldCard from '$lib/components/ComponentFieldCard.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import ComponentTipCard from '$lib/components/ComponentTipCard.svelte';
  import { Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
</script>

<ComponentPage name="MultiSelect" description="Allows the user to select a multiple options from a dropdown list">
  <ComponentFieldCard />
  <ComponentTipCard>
    <Text>
      The <ComponentLink name="MultiSelect" /> component is very similar to the <ComponentLink name="Select" />
      component, but allows the user to select multiple options.
    </Text>
  </ComponentTipCard>
  <ComponentExamples examples={[{ title: 'Basic', code: basicExample, component: BasicExample }]} />
</ComponentPage>
