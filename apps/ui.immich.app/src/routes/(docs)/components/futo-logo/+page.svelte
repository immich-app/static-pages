<script lang="ts">
  import ComponentExamples from '#lib/components/ComponentExamples.svelte';
  import ComponentPage from '#lib/components/ComponentPage.svelte';
  import SizeExample from './SizeExample.svelte';
  import sizeExample from './SizeExample.svelte?raw';
</script>

<ComponentPage name="FutoLogo" description="A component for displaying the FUTO logo">
  <ComponentExamples examples={[{ title: 'Size', code: sizeExample, component: SizeExample }]} />
</ComponentPage>
