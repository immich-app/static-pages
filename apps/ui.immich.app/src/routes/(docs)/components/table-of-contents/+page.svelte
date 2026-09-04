<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
</script>

<ComponentPage name="TableOfContents" description="Link to the headings on the current page">
  <ComponentExamples examples={[{ title: 'Basic', code: basicExample, component: BasicExample }]} />
</ComponentPage>
