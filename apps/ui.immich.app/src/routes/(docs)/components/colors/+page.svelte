<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import AllColorsExample from './AllColorsExample.svelte';
  import allColorsExample from './AllColorsExample.svelte?raw';
</script>

<ComponentPage name="Colors" description="Color palette and variants available in the design system">
  <ComponentExamples examples={[{ title: 'Colors', code: allColorsExample, component: AllColorsExample }]} />
</ComponentPage>
