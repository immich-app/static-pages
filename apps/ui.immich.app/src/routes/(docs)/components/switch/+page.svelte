<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentFieldCard from '$lib/components/ComponentFieldCard.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import ColorExample from './ColorExample.svelte';
  import colorExample from './ColorExample.svelte?raw';
  import FormExample from './FormExample.svelte';
  import formExample from './FormExample.svelte?raw';
</script>

<ComponentPage name="Switch" description="A boolean input element">
  <ComponentFieldCard />
  <ComponentExamples
    examples={[
      { title: 'Basic', code: basicExample, component: BasicExample },
      { title: 'Color', code: colorExample, component: ColorExample },
      { title: 'Form', code: formExample, component: FormExample },
    ]}
  />
</ComponentPage>
