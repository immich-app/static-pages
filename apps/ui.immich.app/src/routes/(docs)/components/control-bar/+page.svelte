<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import { Markdown, Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import ShapeExample from './ShapeExample.svelte';
  import shapeExample from './ShapeExample.svelte?raw';
  import VariantExample from './VariantExample.svelte';
  import variantExample from './VariantExample.svelte?raw';
</script>

<ComponentPage name="ControlBar" description="A component for displaying a control bar at the top of the page">
  <Markdown.Alert variant="tip">
    <Text>See <ComponentLink name="ActionBar" /> for an action-based control bar.</Text>
  </Markdown.Alert>
  <ComponentExamples
    examples={[
      { title: 'Basic', code: basicExample, component: BasicExample },
      { title: 'Variant', code: variantExample, component: VariantExample },
      { title: 'Shape', code: shapeExample, component: ShapeExample },
    ]}
  />
</ComponentPage>
