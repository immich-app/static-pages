<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import PageDescription from '$lib/components/PageDescription.svelte';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
</script>

<ComponentPage name="Tooltip" description="A component for displaying tooltips on hover or focus">
  <PageDescription>
    Displays supplementary information when users hover over or interact with an element.
  </PageDescription>

  <ComponentExamples examples={[{ title: 'Basic', code: basicExample, component: BasicExample }]} />
</ComponentPage>
