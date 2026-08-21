<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import IconsExample from './IconsExample.svelte';
  import iconsExample from './IconsExample.svelte?raw';
</script>

<ComponentPage
  name="ImageCarousel"
  description="A horizontal scrolling carousel for displaying a list of images"
  size="large"
>
  <ComponentExamples
    examples={[
      { title: 'Basic', code: basicExample, component: BasicExample },
      { title: 'Icons', code: iconsExample, component: IconsExample },
    ]}
  />
</ComponentPage>
