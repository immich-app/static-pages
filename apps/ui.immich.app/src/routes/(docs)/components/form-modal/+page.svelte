<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import ComponentTipCard from '$lib/components/ComponentTipCard.svelte';
  import { Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
</script>

<ComponentPage name="FormModal" description="A specialized modal for forms">
  <ComponentTipCard>
    <Text>See <ComponentLink name="Modal" /> for more complex modals</Text>
  </ComponentTipCard>
  <ComponentExamples examples={[{ title: 'Basic', code: basicExample, component: BasicExample }]} />
</ComponentPage>
